export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined): string {
  return formatDate(value, { day: "numeric", month: "short" });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Sin pago",
  paid: "Pagado",
  refunded: "Reembolsado",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo contraentrega",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  delivery: "Domicilio",
  pickup: "Recoger en tienda",
};

export const PET_TYPE_LABELS: Record<string, string> = {
  perro: "Perros",
  gato: "Gatos",
  ambos: "Perros y gatos",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
