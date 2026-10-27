import { NextResponse } from "next/server";
import { withTransaction, isExclusionViolation } from "@/lib/db";
import { getSettings, buildWhatsAppUrl } from "@/lib/settings";
import { bookingCreateSchema } from "@/lib/validation";
import { generateBookingCode } from "@/lib/booking/code";
import { calculateQuote, QuoteError, todayInColombia, formatCOP } from "@/lib/booking/pricing";
import { checkBlockedDates, checkBookingOverlap } from "@/lib/booking/availability";
import { getBookingByCode } from "@/lib/data/bookings";
import type { GlampingRate } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ConflictError extends Error {}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Revisa los datos de la reserva." }, { status: 400 });
  }
  const data = parsed.data;
  if (data.checkIn < todayInColombia()) {
    return NextResponse.json({ error: "La fecha de llegada no puede estar en el pasado." }, { status: 400 });
  }

  const settings = await getSettings();

  try {
    const created = await withTransaction(async (client) => {
      // Serializa las reservas del mismo alojamiento para evitar carreras.
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [data.glampingId]);

      const glampingResult = await client.query<{
        id: string;
        name: string;
        pricePerNight: number;
        weekendPricePerNight: number | null;
        holidayPricePerNight: number | null;
        capacity: number;
        active: boolean;
      }>(
        `select id, name, price_per_night as "pricePerNight",
                weekend_price_per_night as "weekendPricePerNight",
                holiday_price_per_night as "holidayPricePerNight",
                capacity, active
         from glampings where id = $1 for update`,
        [data.glampingId],
      );
      const glamping = glampingResult.rows[0];
      if (!glamping || !glamping.active) throw new ConflictError("El alojamiento ya no está disponible.");

      if (await checkBlockedDates(glamping.id, data.checkIn, data.checkOut, client)) {
        throw new ConflictError("El alojamiento está bloqueado en esas fechas.");
      }
      if (await checkBookingOverlap(glamping.id, data.checkIn, data.checkOut, undefined, client)) {
        throw new ConflictError("Esas fechas acaban de ser reservadas. Elige otras, por favor.");
      }

      const ratesResult = await client.query<GlampingRate>(
        `select id, glamping_id as "glampingId", name, start_date as "startDate", end_date as "endDate",
                price_per_night as "pricePerNight", min_nights as "minNights", active
         from glamping_rates where glamping_id = $1 and active = true`,
        [glamping.id],
      );
      const activitiesResult = await client.query<{
        id: string;
        name: string;
        price: number;
        weekendPrice: number | null;
        holidayPrice: number | null;
        active: boolean;
        maxPeople: number | null;
      }>(
        `select id, name, price, weekend_price as "weekendPrice", holiday_price as "holidayPrice",
                active, max_people as "maxPeople"
         from activities where active = true`,
      );
      const servicesResult = await client.query<{ id: string; name: string; price: number; active: boolean }>(
        `select id, name, price, active from services where active = true`,
      );

      const quote = calculateQuote({
        glamping,
        rates: ratesResult.rows,
        activities: activitiesResult.rows,
        services: servicesResult.rows,
        selectedActivities: data.activities,
        selectedServices: data.services,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        depositPercent: settings.booking.depositPercent,
        minNights: settings.booking.minNights,
      });

      const existingCustomer = await client.query<{ id: string }>(
        "select id from customers where lower(email) = lower($1) limit 1",
        [data.guestEmail],
      );
      let customerId: string;
      if (existingCustomer.rows[0]) {
        customerId = existingCustomer.rows[0].id;
        await client.query(
          `update customers set full_name = $1, phone = $2, document = coalesce(nullif($3, ''), document),
             city = coalesce(nullif($4, ''), city), updated_at = now() where id = $5`,
          [data.guestName, data.guestPhone, data.guestDocument, data.guestCity, customerId],
        );
      } else {
        const inserted = await client.query<{ id: string }>(
          `insert into customers (full_name, email, phone, document, city)
           values ($1,$2,$3,$4,$5) returning id`,
          [data.guestName, data.guestEmail, data.guestPhone, data.guestDocument, data.guestCity],
        );
        customerId = inserted.rows[0].id;
      }

      let code = generateBookingCode();
      for (let i = 0; i < 5; i++) {
        const exists = await client.query("select 1 from bookings where code = $1", [code]);
        if (exists.rowCount === 0) break;
        code = generateBookingCode();
      }

      const bookingResult = await client.query<{ id: string; code: string }>(
        `insert into bookings
          (code, customer_id, glamping_id, guest_name, guest_email, guest_phone, guest_document, guest_city,
           check_in, check_out, guests, nights, nightly_rate, subtotal, activities_total, services_total,
           total, deposit_required, paid_amount, balance, status, payment_status, source, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,0,$17,'pending','unpaid','web',$19)
         returning id, code`,
        [
          code, customerId, glamping.id, data.guestName, data.guestEmail, data.guestPhone,
          data.guestDocument, data.guestCity, data.checkIn, data.checkOut, data.guests, quote.nights,
          quote.nightlyRate, quote.subtotal, quote.activitiesTotal, quote.servicesTotal, quote.total,
          quote.depositRequired, data.notes,
        ],
      );
      const booking = bookingResult.rows[0];

      for (const line of quote.activityLines) {
        await client.query(
          `insert into booking_activities (booking_id, activity_id, activity_name, quantity, unit_price, total)
           values ($1,$2,$3,$4,$5,$6)`,
          [booking.id, line.activityId, line.name, line.quantity, line.unitPrice, line.total],
        );
      }
      for (const line of quote.serviceLines) {
        await client.query(
          `insert into booking_services (booking_id, service_id, service_name, quantity, unit_price, total)
           values ($1,$2,$3,$4,$5,$6)`,
          [booking.id, line.serviceId, line.name, line.quantity, line.unitPrice, line.total],
        );
      }
      await client.query(
        `insert into booking_status_history (booking_id, from_status, to_status, note, created_by)
         values ($1, null, 'pending', 'Reserva creada desde la web', 'web')`,
        [booking.id],
      );

      return { id: booking.id, code: booking.code, quote };
    });

    const booking = await getBookingByCode(created.code);
    const message = `Hola, acabo de hacer la reserva ${created.code} en Adrenalina Extrema Huila. Fechas: ${data.checkIn} a ${data.checkOut}. Total: ${formatCOP(created.quote.total)}. Anticipo: ${formatCOP(created.quote.depositRequired)}.`;
    return NextResponse.json(
      {
        booking,
        quote: created.quote,
        whatsappUrl: buildWhatsAppUrl(settings.business.whatsapp, message),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    if (isExclusionViolation(error)) {
      return NextResponse.json({ error: "Esas fechas acaban de ser reservadas. Elige otras." }, { status: 409 });
    }
    console.error("booking create", error);
    return NextResponse.json({ error: "No se pudo crear la reserva. Intenta nuevamente." }, { status: 500 });
  }
}
