// Calendario de festivos colombianos.
// Incluye festivos fijos, los trasladados al lunes por la Ley Emiliani y
// los que dependen de la Semana Santa. Las fechas se manejan siempre en UTC
// para evitar cambios de día por zona horaria.

export interface DayInfo {
  kind: "holiday" | "weekend" | "weekday";
  holidayName: string | null;
}

const holidayCache = new Map<number, Map<string, string>>();

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Domingo de Resurrección (algoritmo gregoriano anónimo). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Traslada una fecha al lunes siguiente (si ya es lunes, la deja igual). */
function nextMonday(date: Date): Date {
  const day = date.getUTCDay();
  if (day === 1) return date;
  const delta = (8 - day) % 7;
  return addDays(date, delta);
}

function buildHolidayMap(year: number): Map<string, string> {
  const map = new Map<string, string>();
  const add = (date: Date, name: string) => map.set(toISO(date), name);

  // Festivos fijos (no se trasladan).
  const fixed: Array<[number, number, string]> = [
    [1, 1, "Año Nuevo"],
    [5, 1, "Día del Trabajo"],
    [7, 20, "Día de la Independencia"],
    [8, 7, "Batalla de Boyacá"],
    [12, 8, "Inmaculada Concepción"],
    [12, 25, "Navidad"],
  ];
  for (const [month, day, name] of fixed) {
    add(new Date(Date.UTC(year, month - 1, day)), name);
  }

  // Festivos trasladados al lunes por la Ley Emiliani.
  const emiliani: Array<[number, number, string]> = [
    [1, 6, "Reyes Magos"],
    [3, 19, "San José"],
    [6, 29, "San Pedro y San Pablo"],
    [8, 15, "Asunción de la Virgen"],
    [10, 12, "Día de la Raza"],
    [11, 1, "Todos los Santos"],
    [11, 11, "Independencia de Cartagena"],
  ];
  for (const [month, day, name] of emiliani) {
    add(nextMonday(new Date(Date.UTC(year, month - 1, day))), name);
  }

  // Festivos de Semana Santa y los trasladados al lunes.
  const easter = easterSunday(year);
  add(addDays(easter, -3), "Jueves Santo");
  add(addDays(easter, -2), "Viernes Santo");
  add(addDays(easter, 43), "Ascensión del Señor");
  add(addDays(easter, 64), "Corpus Christi");
  add(addDays(easter, 71), "Sagrado Corazón");

  return map;
}

function holidaysForYear(year: number): Map<string, string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const map = buildHolidayMap(year);
  holidayCache.set(year, map);
  return map;
}

/** Devuelve el nombre del festivo colombiano o null si la fecha no lo es. */
export function getColombianHoliday(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const year = Number(date.slice(0, 4));
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return null;
  return holidaysForYear(year).get(date) ?? null;
}

export function isColombianHoliday(date: string): boolean {
  return getColombianHoliday(date) !== null;
}

/** Sábado o domingo. La tarifa se aplica a la noche que cae en ese día. */
export function isWeekend(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }
  const weekDay = parsed.getUTCDay();
  return weekDay === 0 || weekDay === 6;
}

/** Clasifica una fecha para tarifas: festivo tiene prioridad sobre fin de semana. */
export function getDayInfo(date: string): DayInfo {
  const holidayName = getColombianHoliday(date);
  if (holidayName) return { kind: "holiday", holidayName };
  if (isWeekend(date)) return { kind: "weekend", holidayName: null };
  return { kind: "weekday", holidayName: null };
}

/** Lista de festivos de un año, ordenada por fecha. Útil para paneles y pruebas. */
export function listColombianHolidays(year: number): Array<{ date: string; name: string }> {
  return [...holidaysForYear(year).entries()]
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
