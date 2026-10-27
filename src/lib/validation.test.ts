import { describe, expect, it } from "vitest";
import {
  bookingCreateSchema,
  bookingUpdateSchema,
  contactSchema,
  dateString,
  paymentSchema,
  quoteSchema,
  rateSchema,
} from "./validation";

const validBooking = {
  glampingId: "11111111-1111-4111-8111-111111111111",
  checkIn: "2026-11-10",
  checkOut: "2026-11-13",
  guests: 2,
  guestName: "Laura Gómez",
  guestEmail: "laura@example.com",
  guestPhone: "3001234567",
  acceptTerms: true,
};

describe("bookingCreateSchema", () => {
  it("acepta una reserva válida y aplica valores por defecto", () => {
    const parsed = bookingCreateSchema.safeParse(validBooking);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.activities).toEqual([]);
      expect(parsed.data.services).toEqual([]);
      expect(parsed.data.notes).toBe("");
    }
  });

  it("exige aceptar las condiciones", () => {
    const parsed = bookingCreateSchema.safeParse({ ...validBooking, acceptTerms: false });
    expect(parsed.success).toBe(false);
  });

  it("valida correo y teléfono", () => {
    expect(bookingCreateSchema.safeParse({ ...validBooking, guestEmail: "no-es-correo" }).success).toBe(false);
    expect(bookingCreateSchema.safeParse({ ...validBooking, guestPhone: "123" }).success).toBe(false);
  });
});

describe("quoteSchema", () => {
  it("convierte cantidades y rechaza huéspedes inválidos", () => {
    const parsed = quoteSchema.safeParse({
      glampingId: "11111111-1111-4111-8111-111111111111",
      checkIn: "2026-11-10",
      checkOut: "2026-11-13",
      guests: "2",
      activities: [{ activityId: "22222222-2222-4222-8222-222222222222", quantity: "1" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.guests).toBe(2);

    expect(quoteSchema.safeParse({ ...validBooking, guests: 0 }).success).toBe(false);
  });
});

describe("bookingUpdateSchema", () => {
  it("acepta estados conocidos y rechaza otros", () => {
    expect(bookingUpdateSchema.safeParse({ status: "confirmed" }).success).toBe(true);
    expect(bookingUpdateSchema.safeParse({ status: "en_curso" }).success).toBe(false);
  });

  it("valida el formato de fechas", () => {
    expect(bookingUpdateSchema.safeParse({ checkIn: "2026-11-10" }).success).toBe(true);
    expect(bookingUpdateSchema.safeParse({ checkIn: "10-11-2026" }).success).toBe(false);
  });
});

describe("paymentSchema", () => {
  it("acepta métodos válidos y montos positivos", () => {
    expect(paymentSchema.safeParse({ amount: 150_000, method: "nequi" }).success).toBe(true);
  });

  it("rechaza montos no positivos y métodos desconocidos", () => {
    expect(paymentSchema.safeParse({ amount: 0, method: "cash" }).success).toBe(false);
    expect(paymentSchema.safeParse({ amount: -10, method: "cash" }).success).toBe(false);
    expect(paymentSchema.safeParse({ amount: 10_000, method: "bitcoin" }).success).toBe(false);
  });
});

describe("contactSchema y dateString", () => {
  it("valida el formulario de contacto", () => {
    expect(contactSchema.safeParse({ name: "Ana", email: "ana@example.com", message: "Quiero información del glamping." }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "A", email: "ana@example.com", message: "Hola" }).success).toBe(false);
  });

  it("exige fechas ISO completas", () => {
    expect(dateString.safeParse("2026-11-10").success).toBe(true);
    expect(dateString.safeParse("2026-1-1").success).toBe(false);
  });
});

describe("rateSchema", () => {
  it("exige un rango de tarifa coherente en formato", () => {
    expect(
      rateSchema.safeParse({
        name: "Temporada alta",
        startDate: "2026-12-20",
        endDate: "2027-01-05",
        pricePerNight: 400_000,
      }).success,
    ).toBe(true);
    expect(
      rateSchema.safeParse({
        name: "X",
        startDate: "20/12/2026",
        endDate: "2027-01-05",
        pricePerNight: 400_000,
      }).success,
    ).toBe(false);
  });
});
