import { query, queryOne } from "@/lib/db";
import type { BusinessSettings, Settings, StoreSettings } from "@/types";

export const DEFAULT_SETTINGS: Settings = {
  business: {
    name: "Carnalitos",
    tagline: "Snacks y comida saludable para mascotas",
    description:
      "Carnalitos es una tienda colombiana de snacks naturales, comida saludable y premios para perros y gatos. Hacemos productos con ingredientes reales, sin conservantes ni colorantes artificiales.",
    phone: process.env.NEXT_PUBLIC_WHATSAPP || "+57 310 833 8636",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "+573108338636",
    email: process.env.ADMIN_EMAIL || "carnalitosbarf@gmail.com",
    address: "Medellín, Colombia",
    city: "Medellín",
    mapQuery: "Medellín, Colombia",
    instagram: "https://www.instagram.com/carnalitos.co/",
    facebook: "",
    tiktok: "",
    schedule: "Lunes a sábado · 8:00 a. m. a 6:00 p. m.",
    provisional: false,
  },
  store: {
    currency: "COP",
    shippingCost: 12000,
    freeShippingThreshold: 120000,
    pickupAddress: "Medellín · entrega coordinada por WhatsApp",
    pickupSchedule: "Lunes a sábado, 9:00 a. m. a 5:00 p. m.",
    deliveryNote:
      "Entregas exclusivas en Medellín en 24 a 48 horas.",
    terms:
      "Los pedidos se confirman por WhatsApp o correo. El pago contraentrega está disponible en Medellín. Los productos son elaborados de forma artesanal; las imágenes son de referencia.",
    lowStockThreshold: 5,
  },
};

function merge<T extends Record<string, unknown>>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object"
    ) {
      result[key] = merge(base[key] as Record<string, unknown>, value);
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as T;
}

export async function getSettings(): Promise<Settings> {
  let stored: Record<string, Record<string, unknown>> = {};
  try {
    const rows = await query<{ key: string; value: Record<string, unknown> }>(
      "select key, value from settings",
    );
    stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    // Si la base de datos no está disponible, se usan los valores por defecto
  }

  const business = merge(
    DEFAULT_SETTINGS.business as unknown as Record<string, unknown>,
    stored.business,
  ) as unknown as BusinessSettings;

  // Si la BD contiene datos provisionales o si se configuran variables de entorno:
  const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP;
  if (
    envWhatsapp ||
    !business.whatsapp ||
    business.whatsapp.includes("3000000000") ||
    business.whatsapp.includes("300 000")
  ) {
    const target = envWhatsapp || "+573108338636";
    business.whatsapp = target;
    if (!business.phone || business.phone.includes("3000000000") || business.phone.includes("300 000")) {
      business.phone = "+57 310 833 8636";
    }
  }

  const envEmail = process.env.ADMIN_EMAIL;
  if (envEmail || !business.email || business.email === "hola@carnalitos.co") {
    business.email = envEmail || "carnalitosbarf@gmail.com";
  }

  const store = merge(
    DEFAULT_SETTINGS.store as unknown as Record<string, unknown>,
    stored.store,
  ) as unknown as StoreSettings;

  // Sanitización obligatoria: eliminar cualquier rezago de "Bogotá" o "envíos nacionales"
  if (typeof store.terms === "string") {
    store.terms = store.terms.replace(/bogot[aá]/gi, "Medellín");
  }
  if (typeof store.pickupAddress === "string") {
    store.pickupAddress = store.pickupAddress.replace(/bogot[aá]/gi, "Medellín");
  }
  if (typeof store.deliveryNote === "string") {
    store.deliveryNote = store.deliveryNote
      .replace(/bogot[aá]/gi, "Medellín")
      .replace(/y envíos nacionales en \d a \d días hábiles\.?/gi, "");
  }
  if (typeof business.address === "string") {
    business.address = business.address.replace(/bogot[aá]/gi, "Medellín");
  }
  if (typeof business.city === "string") {
    business.city = business.city.replace(/bogot[aá]/gi, "Medellín");
  }
  if (typeof business.mapQuery === "string") {
    business.mapQuery = business.mapQuery.replace(/bogot[aá]/gi, "Medellín");
  }

  return {
    business,
    store,
  };
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await queryOne<{ value: T }>("select value from settings where key = $1", [key]);
  return row?.value ?? null;
}

export async function updateSettingsSection(
  key: keyof Settings,
  value: Record<string, unknown>,
): Promise<void> {
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
  return phone
    .replace(/^\+?57/, "")
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
