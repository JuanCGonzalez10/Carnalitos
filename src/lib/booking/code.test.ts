import { describe, expect, it } from "vitest";
import { generateBookingCode } from "./code";

describe("generateBookingCode", () => {
  it("genera códigos con el prefijo y el alfabeto esperado", () => {
    const code = generateBookingCode();
    expect(code).toMatch(/^AEH-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("evita caracteres ambiguos como I, O, 0 y 1", () => {
    const codes = Array.from({ length: 100 }, () => generateBookingCode()).join("");
    expect(codes).not.toMatch(/[IO01]/);
  });

  it("genera códigos distintos en una muestra razonable", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateBookingCode()));
    expect(codes.size).toBeGreaterThan(190);
  });
});
