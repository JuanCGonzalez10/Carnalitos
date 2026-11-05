import { z } from "zod";

export const uuid = z.string().uuid("Identificador inválido");

export const slug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones");

const optionalNullableMoney = z
  .preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().min(0).max(100_000_000).nullable(),
  )
  .optional();

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

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: slug.optional(),
  description: z.string().max(400).optional().default(""),
  icon: z.string().max(40).optional().default("paw"),
  image: z.string().max(500).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2).max(140),
  slug: slug.optional(),
  categoryId: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().uuid().nullable(),
  ).optional(),
  shortDescription: z.string().max(300).optional().default(""),
  description: z.string().max(6000).optional().default(""),
  price: z.coerce.number().min(0).max(100_000_000),
  compareAtPrice: optionalNullableMoney,
  stock: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  sku: z.string().max(60).optional().default(""),
  unit: z.string().max(40).optional().default("unidad"),
  weight: z.string().max(40).optional().default(""),
  petType: z.enum(["perro", "gato", "ambos"]).optional().default("ambos"),
  benefits: z.array(z.string().max(160)).optional().default([]),
  ingredients: z.string().max(3000).optional().default(""),
  image: z.string().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const productQuickUpdateSchema = z
  .object({
    price: z.coerce.number().min(0).max(100_000_000).optional(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No hay cambios para guardar");

export const orderItemSchema = z.object({
  productId: uuid,
  quantity: z.coerce.number().int().min(1).max(99),
});

export const orderCreateSchema = z
  .object({
    customerName: z.string().min(2).max(120),
    customerEmail: z.string().email("Correo inválido"),
    customerPhone: z.string().min(7).max(30),
    deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
    address: z.string().max(300).optional().default(""),
    city: z.string().max(100).optional().default(""),
    notes: z.string().max(1000).optional().default(""),
    paymentMethod: z.enum(["cash", "nequi", "bancolombia", "transfer"]).default("cash"),
    items: z.array(orderItemSchema).min(1, "Tu carrito está vacío").max(50),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar las condiciones de compra" }),
    }),
  })
  .superRefine((data, context) => {
    if (data.deliveryMethod === "delivery" && data.address.trim().length < 5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Escribe una dirección de entrega",
      });
    }
    if (data.deliveryMethod === "delivery" && data.city.trim().length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "Indica la ciudad de entrega",
      });
    }
  });

export const orderUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  paymentMethod: z.enum(["cash", "nequi", "bancolombia", "card", "transfer", "other"]).optional(),
  adminNotes: z.string().max(3000).optional(),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2).max(120),
  tagline: z.string().max(200),
  description: z.string().max(2000),
  phone: z.string().max(40),
  whatsapp: z.string().max(40),
  email: z.string().email(),
  address: z.string().max(300),
  city: z.string().max(100),
  mapQuery: z.string().max(300),
  instagram: z.string().max(300),
  facebook: z.string().max(300),
  tiktok: z.string().max(300),
  schedule: z.string().max(200),
  provisional: z.boolean().optional().default(true),
});

export const storeSettingsSchema = z.object({
  currency: z.string().max(10),
  shippingCost: z.coerce.number().min(0).max(1_000_000),
  freeShippingThreshold: z.coerce.number().min(0).max(10_000_000),
  pickupAddress: z.string().max(300),
  pickupSchedule: z.string().max(200),
  deliveryNote: z.string().max(1000),
  terms: z.string().max(3000),
  lowStockThreshold: z.coerce.number().int().min(0).max(9999),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});
