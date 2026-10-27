import { describe, expect, it } from "vitest";
import { rangesOverlap } from "./overlap";

describe("rangesOverlap (daterange [) )", () => {
  it("permite salida y llegada el mismo día", () => {
    expect(rangesOverlap("2026-11-10", "2026-11-12", "2026-11-12", "2026-11-14")).toBe(false);
    expect(rangesOverlap("2026-11-12", "2026-11-14", "2026-11-10", "2026-11-12")).toBe(false);
  });

  it("detecta cruces parciales y totales", () => {
    expect(rangesOverlap("2026-11-10", "2026-11-13", "2026-11-12", "2026-11-14")).toBe(true);
    expect(rangesOverlap("2026-11-10", "2026-11-20", "2026-11-12", "2026-11-14")).toBe(true);
    expect(rangesOverlap("2026-11-10", "2026-11-12", "2026-11-10", "2026-11-12")).toBe(true);
  });

  it("no marca como cruce rangos separados", () => {
    expect(rangesOverlap("2026-11-01", "2026-11-03", "2026-11-10", "2026-11-12")).toBe(false);
    expect(rangesOverlap("2026-11-10", "2026-11-12", "2026-11-01", "2026-11-03")).toBe(false);
  });
});
