import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { listGlampings, getRatesForGlampings } from "@/lib/data/glampings";
import { listActivities, listServices } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import {
  calculateQuote,
  QuoteError,
  type QuoteResult,
  type SelectedActivity,
  type SelectedService,
} from "@/lib/booking/pricing";
import type { AvailabilityItem, Glamping } from "@/types";

export async function checkBookingOverlap(
  glampingId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
  client?: PoolClient,
): Promise<boolean> {
  const sql = `
    select 1 from bookings
    where glamping_id = $1
      and status in ('pending', 'confirmed', 'checked_in')
      and daterange(check_in, check_out, '[)') && daterange($2::date, $3::date, '[)')
      ${excludeBookingId ? "and id <> $4" : ""}
    limit 1
  `;
  const params = excludeBookingId
    ? [glampingId, checkIn, checkOut, excludeBookingId]
    : [glampingId, checkIn, checkOut];
  const rows = client ? (await client.query(sql, params)).rows : await query(sql, params);
  return rows.length > 0;
}

export async function checkBlockedDates(
  glampingId: string,
  checkIn: string,
  checkOut: string,
  client?: PoolClient,
): Promise<boolean> {
  const sql = `
    select 1 from blocked_dates
    where glamping_id = $1
      and daterange(start_date, end_date + 1, '[)') && daterange($2::date, $3::date, '[)')
    limit 1
  `;
  const rows = client
    ? (await client.query(sql, [glampingId, checkIn, checkOut])).rows
    : await query(sql, [glampingId, checkIn, checkOut]);
  return rows.length > 0;
}

export async function isGlampingAvailable(
  glampingId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
  client?: PoolClient,
): Promise<{ available: boolean; reason?: string }> {
  if (await checkBlockedDates(glampingId, checkIn, checkOut, client)) {
    return { available: false, reason: "El alojamiento no está disponible en esas fechas." };
  }
  if (await checkBookingOverlap(glampingId, checkIn, checkOut, excludeBookingId, client)) {
    return { available: false, reason: "Ya existe una reserva para esas fechas." };
  }
  return { available: true };
}

export async function quoteForGlamping(input: {
  glamping: Glamping;
  checkIn: string;
  checkOut: string;
  guests: number;
  selectedActivities?: SelectedActivity[];
  selectedServices?: SelectedService[];
}): Promise<QuoteResult> {
  const [rates, activities, services, settings] = await Promise.all([
    getRatesForGlampings([input.glamping.id]),
    listActivities(),
    listServices(),
    getSettings(),
  ]);
  return calculateQuote({
    glamping: input.glamping,
    rates,
    activities,
    services,
    selectedActivities: input.selectedActivities ?? [],
    selectedServices: input.selectedServices ?? [],
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    depositPercent: settings.booking.depositPercent,
    minNights: settings.booking.minNights,
  });
}

export async function getAvailability(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<AvailabilityItem[]> {
  const glampings = await listGlampings();
  if (!glampings.length) return [];
  const ids = glampings.map((glamping) => glamping.id);
  const [rates, activities, services, settings] = await Promise.all([
    getRatesForGlampings(ids),
    listActivities(),
    listServices(),
    getSettings(),
  ]);

  const [overlaps, blocks] = await Promise.all([
    query<{ glampingId: string }>(
      `select distinct glamping_id as "glampingId" from bookings
       where glamping_id = any($1::uuid[])
         and status in ('pending', 'confirmed', 'checked_in')
         and daterange(check_in, check_out, '[)') && daterange($2::date, $3::date, '[)')`,
      [ids, input.checkIn, input.checkOut],
    ),
    query<{ glampingId: string }>(
      `select distinct glamping_id as "glampingId" from blocked_dates
       where glamping_id = any($1::uuid[])
         and daterange(start_date, end_date + 1, '[)') && daterange($2::date, $3::date, '[)')`,
      [ids, input.checkIn, input.checkOut],
    ),
  ]);
  const unavailable = new Set([...overlaps, ...blocks].map((row) => row.glampingId));

  return glampings.map((glamping) => {
    if (input.guests > glamping.capacity) {
      return {
        glamping,
        available: false,
        quote: null,
        reason: `Capacidad máxima: ${glamping.capacity} huéspedes.`,
      };
    }
    try {
      const quote = calculateQuote({
        glamping,
        rates: rates.filter((rate) => rate.glampingId === glamping.id),
        activities,
        services,
        selectedActivities: [],
        selectedServices: [],
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        depositPercent: settings.booking.depositPercent,
        minNights: settings.booking.minNights,
      });
      if (unavailable.has(glamping.id)) {
        return { glamping, available: false, quote, reason: "No disponible en esas fechas." };
      }
      return { glamping, available: true, quote };
    } catch (error) {
      return {
        glamping,
        available: false,
        quote: null,
        reason: error instanceof QuoteError ? error.message : "No se pudo calcular la tarifa.",
      };
    }
  });
}
