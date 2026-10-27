/**
 * Comprueba si dos rangos de fechas se cruzan usando la misma semántica que
 * PostgreSQL `daterange(inicio, fin, '[)')`: el día de salida no ocupa noche,
 * por lo que una reserva puede salir y otra entrar el mismo día.
 */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}
