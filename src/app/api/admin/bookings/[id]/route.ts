import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { getBookingById } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { withTransaction, isExclusionViolation } from "@/lib/db";
import { bookingUpdateSchema } from "@/lib/validation";
import { calculateQuote, roundCOP, QuoteError } from "@/lib/booking/pricing";
import { checkBlockedDates, checkBookingOverlap } from "@/lib/booking/availability";
import type { GlampingRate } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const existing = await getBookingById(id);
    if (!existing) return jsonError("Reserva no encontrada.", 404);

    const parsed = bookingUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = parsed.data;
    const settings = await getSettings();

    await withTransaction(async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [existing.glampingId]);
      const currentResult = await client.query<{
        id: string;
        checkIn: string;
        checkOut: string;
        guests: number;
        status: string;
        total: number;
        paidAmount: number;
        depositRequired: number;
        activitiesTotal: number;
        servicesTotal: number;
      }>(
        `select id, check_in as "checkIn", check_out as "checkOut", guests, status, total,
                paid_amount as "paidAmount", deposit_required as "depositRequired",
                activities_total as "activitiesTotal", services_total as "servicesTotal"
         from bookings where id = $1 for update`,
        [id],
      );
      const current = currentResult.rows[0];
      if (!current) throw new Error("not_found");

      const checkIn = data.checkIn ?? current.checkIn;
      const checkOut = data.checkOut ?? current.checkOut;
      const guests = data.guests ?? current.guests;
      const status = data.status ?? current.status;
      const datesChanged = checkIn !== current.checkIn || checkOut !== current.checkOut;
      const guestsChanged = guests !== current.guests;
      const reactivating = current.status === "cancelled" && status !== "cancelled";
      const active = ["pending", "confirmed", "checked_in"].includes(status);

      let newTotal = current.total;
      let newDeposit = data.depositRequired ?? current.depositRequired;
      let newNights: number | null = null;
      let newNightlyRate: number | null = null;
      let newSubtotal: number | null = null;

      if ((datesChanged || guestsChanged || reactivating) && active) {
        const glampingResult = await client.query<{
          id: string;
          pricePerNight: number;
          weekendPricePerNight: number | null;
          holidayPricePerNight: number | null;
          capacity: number;
        }>(
          `select id, price_per_night as "pricePerNight",
                  weekend_price_per_night as "weekendPricePerNight",
                  holiday_price_per_night as "holidayPricePerNight",
                  capacity
           from glampings where id = $1`,
          [existing.glampingId],
        );
        const glamping = glampingResult.rows[0];
        if (!glamping) throw new Error("glamping_not_found");
        if (guests > glamping.capacity) throw new Error(`capacity:${glamping.capacity}`);
        if (await checkBlockedDates(glamping.id, checkIn, checkOut, client)) throw new Error("blocked");
        if (await checkBookingOverlap(glamping.id, checkIn, checkOut, id, client)) throw new Error("overlap");

        const ratesResult = await client.query<GlampingRate>(
          `select id, glamping_id as "glampingId", name, start_date as "startDate", end_date as "endDate",
                  price_per_night as "pricePerNight", min_nights as "minNights", active
           from glamping_rates where glamping_id = $1 and active = true`,
          [glamping.id],
        );
        const stay = calculateQuote({
          glamping,
          rates: ratesResult.rows,
          activities: [],
          services: [],
          selectedActivities: [],
          selectedServices: [],
          checkIn,
          checkOut,
          guests,
          depositPercent: settings.booking.depositPercent,
          minNights: settings.booking.minNights,
        });
        newNights = stay.nights;
        newNightlyRate = stay.nightlyRate;
        newSubtotal = stay.subtotal;
        newTotal = stay.subtotal + current.activitiesTotal + current.servicesTotal;
        if (data.depositRequired === undefined) {
          newDeposit = roundCOP((newTotal * settings.booking.depositPercent) / 100);
        }
      }

      await client.query(
        `update bookings set
           check_in = $1, check_out = $2, guests = $3, status = $4,
           nights = coalesce($5, nights), nightly_rate = coalesce($6, nightly_rate),
           subtotal = coalesce($7, subtotal), total = $8, deposit_required = $9,
           balance = greatest($8 - paid_amount, 0),
           admin_notes = coalesce($10, admin_notes), notes = coalesce($11, notes),
           updated_at = now()
         where id = $12`,
        [
          checkIn, checkOut, guests, status, newNights, newNightlyRate, newSubtotal, newTotal,
          newDeposit, data.adminNotes ?? null, data.notes ?? null, id,
        ],
      );

      if (status !== current.status) {
        await client.query(
          `insert into booking_status_history (booking_id, from_status, to_status, note, created_by)
           values ($1,$2,$3,$4,$5)`,
          [id, current.status, status, data.adminNotes ?? "Cambio de estado desde el panel", auth.user.email],
        );
      }
      await client.query(
        `update bookings b set payment_status = case
           when b.paid_amount >= b.total then 'paid'
           when b.paid_amount >= b.deposit_required and b.deposit_required > 0 then 'deposit_paid'
           when b.paid_amount > 0 and b.deposit_required = 0 then 'deposit_paid'
           else 'unpaid' end
         where b.id = $1`,
        [id],
      );
    });

    const booking = await getBookingById(id);
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof QuoteError) return jsonError(error.message);
    if (error instanceof Error) {
      if (error.message.startsWith("capacity:")) return jsonError(`Capacidad máxima: ${error.message.split(":")[1]} huéspedes.`);
      if (error.message === "blocked") return jsonError("El alojamiento está bloqueado en esas fechas.", 409);
      if (error.message === "overlap") return jsonError("Ya existe otra reserva para esas fechas.", 409);
      if (error.message === "glamping_not_found") return jsonError("Alojamiento no encontrado.", 404);
    }
    if (isExclusionViolation(error)) return jsonError("Ya existe otra reserva para esas fechas.", 409);
    return handleApiError(error, "update booking");
  }
}
