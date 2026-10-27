import { query, queryOne } from "@/lib/db";
import type { BusinessSettings, BookingSettings, IntegrationSettings, Settings } from "@/types";

export const DEFAULT_SETTINGS: Settings = {
  business: {
    name: "Adrenalina Extrema Huila",
    tagline: "Aventura y glamping en el Cañón del Magdalena",
    description:
      "Un refugio de aventura en el sur del Huila. Glamping entre montañas, río y bosque, con experiencias diseñadas para reconectar con lo salvaje.",
    phone: "+57 300 000 0000",
    whatsapp: "+573000000000",
    email: "reservas@adrenalinaextrema.co",
    address: "Cañón del Magdalena, Huila, Colombia",
    mapQuery: "Cañón del Magdalena, Huila, Colombia",
    instagram: "https://instagram.com/adextremahuila/",
    facebook: "https://facebook.com/",
    tiktok: "",
    schedule: "Todos los días · 7:00 a. m. a 8:00 p. m.",
    provisional: true,
  },
  booking: {
    currency: "COP",
    depositPercent: 30,
    minNights: 1,
    checkInTime: "3:00 p. m.",
    checkOutTime: "12:00 m.",
    maxGuests: 12,
    terms:
      "La reserva se confirma con el pago del anticipo. Las tarifas pueden variar en temporada alta. La cancelación con reembolso aplica hasta 7 días antes de la llegada; después se abona a una nueva fecha según disponibilidad.",
  },
  integrations: {
    payments: { provider: "wompi", enabled: false, publicKeyConfigured: false },
    electronicInvoice: { provider: "factus", enabled: false, dianValidated: false },
    email: { provider: "smtp", enabled: false },
  },
};

function merge<T extends Record<string, unknown>>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object") {
      result[key] = merge(base[key] as Record<string, unknown>, value);
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as T;
}

export function integrationStatus(): IntegrationSettings {
  const paymentsConfigured = Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_PRIVATE_KEY);
  const invoiceConfigured = Boolean(process.env.FACTUS_CLIENT_ID && process.env.FACTUS_CLIENT_SECRET);
  const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  return {
    payments: {
      provider: "wompi",
      enabled: paymentsConfigured,
      publicKeyConfigured: Boolean(process.env.WOMPI_PUBLIC_KEY),
    },
    electronicInvoice: {
      provider: "factus",
      enabled: invoiceConfigured,
      // La app no valida facturas ante la DIAN. Un proveedor autorizado lo hace.
      dianValidated: false,
    },
    email: { provider: "smtp", enabled: emailConfigured },
  };
}

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: Record<string, unknown> }>("select key, value from settings");
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const envIntegrations = integrationStatus();
  return {
    business: merge(DEFAULT_SETTINGS.business as unknown as Record<string, unknown>, stored.business) as unknown as BusinessSettings,
    booking: merge(DEFAULT_SETTINGS.booking as unknown as Record<string, unknown>, stored.booking) as unknown as BookingSettings,
    integrations: {
      ...merge(DEFAULT_SETTINGS.integrations as unknown as Record<string, unknown>, stored.integrations),
      ...envIntegrations,
    } as IntegrationSettings,
  };
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await queryOne<{ value: T }>("select value from settings where key = $1", [key]);
  return row?.value ?? null;
}

export async function updateSettingsSection(key: keyof Settings, value: Record<string, unknown>): Promise<void> {
  await query(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = settings.value || excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function formatWhatsAppDisplay(phone: string): string {
  return phone.replace(/^\+?57/, "").replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
