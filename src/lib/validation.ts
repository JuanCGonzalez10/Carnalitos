import { z } from "zod";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

// Acepta un número, una cadena vacía o null. Se usa para tarifas opcionales:
// si el campo se deja vacío, la tarifa queda en null y se usa la base.
const optionalNullableMoney = z
  .preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().min(0).max(100_000_000).nullable(),
  )
  .optional();
export const uuid = z.string().uuid("Identificador inválido");
export const slug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones");

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Contraseña demasiado corta"),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().default(""),
  subject: z.string().max(120).optional().default(""),
  message: z.string().min(10).max(2000),
});

export const quoteSchema = z.object({
  glampingId: uuid,
  checkIn: dateString,
  checkOut: dateString,
  guests: z.coerce.number().int().min(1).max(20),
  activities: z
    .array(z.object({ activityId: uuid, quantity: z.coerce.number().int().min(1).max(20) }))
    .optional()
    .default([]),
  services: z
    .array(z.object({ serviceId: uuid, quantity: z.coerce.number().int().min(1).max(20) }))
    .optional()
    .default([]),
});

export const bookingCreateSchema = quoteSchema.extend({
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(7).max(30),
  guestDocument: z.string().max(30).optional().default(""),
  guestCity: z.string().max(100).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar las condiciones" }) }),
});

export const glampingSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slug.optional(),
  tagline: z.string().max(160).optional().default(""),
  shortDescription: z.string().max(300).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  pricePerNight: z.coerce.number().min(0).max(100_000_000),
  weekendPricePerNight: optionalNullableMoney,
  holidayPricePerNight: optionalNullableMoney,
  capacity: z.coerce.number().int().min(1).max(30),
  bedrooms: z.coerce.number().int().min(0).max(20).optional().default(1),
  bathrooms: z.coerce.number().int().min(0).max(20).optional().default(1),
  sizeM2: z.coerce.number().int().min(0).max(10_000).nullable().optional(),
  amenities: z.array(z.string().max(80)).optional().default([]),
  includes: z.array(z.string().max(120)).optional().default([]),
  conditions: z.string().max(2000).optional().default(""),
  location: z.string().max(200).optional().default(""),
  mainImage: z.string().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const activitySchema = z.object({
  name: z.string().min(2).max(120),
  slug: slug.optional(),
  category: z.string().max(60).optional().default("Aventura"),
  shortDescription: z.string().max(300).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  price: z.coerce.number().min(0).max(100_000_000),
  weekendPrice: optionalNullableMoney,
  holidayPrice: optionalNullableMoney,
  priceUnit: z.string().max(30).optional().default("persona"),
  duration: z.string().max(60).optional().default(""),
  difficulty: z.string().max(30).optional().default("Media"),
  minAge: z.coerce.number().int().min(0).max(100).optional().default(8),
  maxPeople: z.coerce.number().int().min(1).max(100).nullable().optional(),
  includes: z.array(z.string().max(120)).optional().default([]),
  requirements: z.string().max(2000).optional().default(""),
  image: z.string().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(""),
  price: z.coerce.number().min(0).max(100_000_000),
  priceUnit: z.string().max(30).optional().default("servicio"),
  image: z.string().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const gallerySchema = z.object({
  url: z.string().min(1).max(500),
  alt: z.string().max(200).optional().default(""),
  category: z.string().max(60).optional().default("General"),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  method: z.enum(["cash", "nequi", "bancolombia", "card", "transfer", "other"]),
  reference: z.string().max(120).optional().default(""),
  paidAt: dateString.optional(),
  notes: z.string().max(500).optional().default(""),
});

export const bookingUpdateSchema = z.object({
  checkIn: dateString.optional(),
  checkOut: dateString.optional(),
  guests: z.coerce.number().int().min(1).max(30).optional(),
  status: z
    .enum(["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"])
    .optional(),
  adminNotes: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  depositRequired: z.coerce.number().min(0).optional(),
});

export const rateSchema = z.object({
  name: z.string().min(2).max(120),
  startDate: dateString,
  endDate: dateString,
  pricePerNight: z.coerce.number().min(0).max(100_000_000),
  minNights: z.coerce.number().int().min(1).max(30).optional().default(1),
  active: z.boolean().optional().default(true),
});

export const blockSchema = z.object({
  startDate: dateString,
  endDate: dateString,
  reason: z.string().max(200).optional().default(""),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2).max(120),
  tagline: z.string().max(200),
  description: z.string().max(2000),
  phone: z.string().max(40),
  whatsapp: z.string().max(40),
  email: z.string().email(),
  address: z.string().max(300),
  mapQuery: z.string().max(300),
  instagram: z.string().max(300),
  facebook: z.string().max(300),
  tiktok: z.string().max(300),
  schedule: z.string().max(200),
  provisional: z.boolean().optional().default(true),
});

export const bookingSettingsSchema = z.object({
  depositPercent: z.coerce.number().min(0).max(100),
  minNights: z.coerce.number().int().min(1).max(30),
  checkInTime: z.string().max(30),
  checkOutTime: z.string().max(30),
  maxGuests: z.coerce.number().int().min(1).max(50),
  terms: z.string().max(3000),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});
