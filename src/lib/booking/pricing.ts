import { getColombianHoliday, getDayInfo, isWeekend } from "@/lib/booking/holidays";

export type QuoteErrorCode =
  | "invalid_dates"
  | "past_date"
  | "min_nights"
  | "capacity"
  | "invalid_extras"
  | "unavailable";

export type NightPriceKind = "seasonal" | "holiday" | "weekend" | "base";
export type ActivityPriceKind = "holiday" | "weekend" | "base";

export interface NightPrice {
  date: string;
  price: number;
  label: string;
  kind: NightPriceKind;
}

export class QuoteError extends Error {
  code: QuoteErrorCode;
  constructor(code: QuoteErrorCode, message: string) {
    super(message);
    this.name = "QuoteError";
    this.code = code;
  }
}

export interface PricingGlamping {
  id: string;
  pricePerNight: number;
  weekendPricePerNight?: number | null;
  holidayPricePerNight?: number | null;
  capacity: number;
}

export interface PricingRate {
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights: number;
  name: string;
  active: boolean;
}

export interface PricingActivity {
  id: string;
  name: string;
  price: number;
  weekendPrice?: number | null;
  holidayPrice?: number | null;
  active: boolean;
  maxPeople?: number | null;
}

export interface PricingService {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface SelectedActivity {
  activityId: string;
  quantity: number;
}

export interface SelectedService {
  serviceId: string;
  quantity: number;
}

export interface QuoteResult {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  activitiesTotal: number;
  servicesTotal: number;
  total: number;
  depositRequired: number;
  balance: number;
  minNights: number;
  rateName: string;
  nightlyBreakdown: NightPrice[];
  activityLines: Array<{
    activityId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    priceLabel: string;
    priceKind: ActivityPriceKind;
  }>;
  serviceLines: Array<{ serviceId: string; name: string; quantity: number; unitPrice: number; total: number }>;
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

export function todayInColombia(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const total = nightsBetween(checkIn, checkOut);
  for (let i = 0; i < total; i++) nights.push(addDays(checkIn, i));
  return nights;
}

export function roundCOP(value: number): number {
  return Math.round(value / 100) * 100;
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Precio de una actividad según la fecha de llegada de la reserva.
 * Prioridad: festivo colombiano > fin de semana (sábado/domingo) > tarifa base.
 * Si una fecha es festiva y además cae en fin de semana, se usa la tarifa de
 * festivo; si no está configurada, se intenta la de fin de semana y luego la base.
 */
export function getActivityUnitPrice(
  activity: PricingActivity,
  date: string,
): { unitPrice: number; priceLabel: string; priceKind: ActivityPriceKind } {
  const holidayName = getColombianHoliday(date);
  if (holidayName) {
    if (activity.holidayPrice != null) {
      return {
        unitPrice: activity.holidayPrice,
        priceLabel: `Festivo: ${holidayName}`,
        priceKind: "holiday",
      };
    }
    if (isWeekend(date) && activity.weekendPrice != null) {
      return {
        unitPrice: activity.weekendPrice,
        priceLabel: "Tarifa fin de semana",
        priceKind: "weekend",
      };
    }
    return { unitPrice: activity.price, priceLabel: "Tarifa base", priceKind: "base" };
  }

  if (isWeekend(date) && activity.weekendPrice != null) {
    return {
      unitPrice: activity.weekendPrice,
      priceLabel: "Tarifa fin de semana",
      priceKind: "weekend",
    };
  }

  return { unitPrice: activity.price, priceLabel: "Tarifa base", priceKind: "base" };
}

function nightPrice(
  glamping: PricingGlamping,
  rates: PricingRate[],
  night: string,
): { price: number; label: string; kind: NightPriceKind; minNights?: number } {
  // 1. Tarifa de temporada (rango de fechas) tiene prioridad.
  const applicable = rates
    .filter((rate) => rate.active && rate.startDate <= night && night <= rate.endDate)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
  if (applicable) {
    return {
      price: applicable.pricePerNight,
      label: applicable.name,
      kind: "seasonal",
      minNights: applicable.minNights,
    };
  }

  // 2. Festivo colombiano.
  const day = getDayInfo(night);
  if (day.kind === "holiday") {
    return {
      price: glamping.holidayPricePerNight ?? glamping.pricePerNight,
      label: `Festivo: ${day.holidayName}`,
      kind: "holiday",
    };
  }

  // 3. Fin de semana (sábado o domingo).
  if (day.kind === "weekend") {
    return {
      price: glamping.weekendPricePerNight ?? glamping.pricePerNight,
      label: "Tarifa fin de semana",
      kind: "weekend",
    };
  }

  // 4. Tarifa base.
  return { price: glamping.pricePerNight, label: "Tarifa base", kind: "base" };
}

function summarizeRateName(labels: Set<string>): string {
  if (labels.size === 0) return "Tarifa base";
  if (labels.size === 1) return [...labels][0];
  if (labels.size <= 3) return [...labels].join(" + ");
  return "Tarifas por noche";
}

export function calculateQuote(input: {
  glamping: PricingGlamping;
  rates: PricingRate[];
  activities: PricingActivity[];
  services: PricingService[];
  selectedActivities: SelectedActivity[];
  selectedServices: SelectedService[];
  checkIn: string;
  checkOut: string;
  guests: number;
  depositPercent: number;
  minNights: number;
  today?: string;
}): QuoteResult {
  const today = input.today ?? todayInColombia();
  const start = parseDateOnly(input.checkIn);
  const end = parseDateOnly(input.checkOut);
  if (!start || !end) throw new QuoteError("invalid_dates", "Selecciona fechas válidas.");
  if (input.checkIn < today) throw new QuoteError("past_date", "La fecha de llegada no puede estar en el pasado.");
  if (input.checkOut <= input.checkIn) {
    throw new QuoteError("invalid_dates", "La fecha de salida debe ser posterior a la llegada.");
  }
  if (input.guests < 1) throw new QuoteError("capacity", "Selecciona al menos un huésped.");
  if (input.guests > input.glamping.capacity) {
    throw new QuoteError("capacity", `Este alojamiento permite máximo ${input.glamping.capacity} huéspedes.`);
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < input.minNights) {
    throw new QuoteError("min_nights", `La estadía mínima es de ${input.minNights} noche(s).`);
  }

  let minNights = input.minNights;
  let subtotal = 0;
  const rateLabels = new Set<string>();
  const nightlyBreakdown: NightPrice[] = [];

  for (const night of eachNight(input.checkIn, input.checkOut)) {
    const priced = nightPrice(input.glamping, input.rates, night);
    if (priced.minNights) minNights = Math.max(minNights, priced.minNights);
    subtotal += priced.price;
    rateLabels.add(priced.label);
    nightlyBreakdown.push({ date: night, price: priced.price, label: priced.label, kind: priced.kind });
  }

  if (nights < minNights) {
    throw new QuoteError("min_nights", `La tarifa aplicable requiere mínimo ${minNights} noches.`);
  }

  const activityLines: QuoteResult["activityLines"] = [];
  for (const selected of input.selectedActivities) {
    if (!selected.quantity || selected.quantity < 1) continue;
    const activity = input.activities.find((item) => item.id === selected.activityId);
    if (!activity || !activity.active) throw new QuoteError("invalid_extras", "Una de las actividades ya no está disponible.");
    const max = activity.maxPeople ?? input.guests;
    if (selected.quantity > Math.min(max, input.guests)) {
      throw new QuoteError("invalid_extras", `La cantidad de "${activity.name}" supera el máximo permitido.`);
    }
    const activityPrice = getActivityUnitPrice(activity, input.checkIn);
    activityLines.push({
      activityId: activity.id,
      name: activity.name,
      quantity: selected.quantity,
      unitPrice: activityPrice.unitPrice,
      total: activityPrice.unitPrice * selected.quantity,
      priceLabel: activityPrice.priceLabel,
      priceKind: activityPrice.priceKind,
    });
  }

  const serviceLines = [];
  for (const selected of input.selectedServices) {
    if (!selected.quantity || selected.quantity < 1) continue;
    const service = input.services.find((item) => item.id === selected.serviceId);
    if (!service || !service.active) throw new QuoteError("invalid_extras", "Uno de los servicios ya no está disponible.");
    if (selected.quantity > 20) throw new QuoteError("invalid_extras", "Cantidad de servicio inválida.");
    serviceLines.push({
      serviceId: service.id,
      name: service.name,
      quantity: selected.quantity,
      unitPrice: service.price,
      total: service.price * selected.quantity,
    });
  }

  const activitiesTotal = activityLines.reduce((sum, line) => sum + line.total, 0);
  const servicesTotal = serviceLines.reduce((sum, line) => sum + line.total, 0);
  const total = subtotal + activitiesTotal + servicesTotal;
  const depositRequired = roundCOP((total * input.depositPercent) / 100);

  return {
    nights,
    nightlyRate: Math.round(subtotal / Math.max(nights, 1)),
    subtotal,
    activitiesTotal,
    servicesTotal,
    total,
    depositRequired,
    balance: total,
    minNights,
    rateName: summarizeRateName(rateLabels),
    nightlyBreakdown,
    activityLines,
    serviceLines,
  };
}
