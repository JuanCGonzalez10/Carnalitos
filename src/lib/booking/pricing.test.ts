import { describe, expect, it } from "vitest";
import {
  addDays,
  calculateQuote,
  formatCOP,
  getActivityUnitPrice,
  nightsBetween,
  parseDateOnly,
  QuoteError,
  roundCOP,
  todayInColombia,
} from "./pricing";
import { getColombianHoliday, isWeekend, listColombianHolidays } from "./holidays";

const glamping = { id: "g1", pricePerNight: 300_000, capacity: 4 };

const baseInput = {
  glamping,
  rates: [],
  activities: [{ id: "a1", name: "Rafting", price: 80_000, active: true, maxPeople: 4 }],
  services: [{ id: "s1", name: "Desayuno", price: 50_000, active: true }],
  selectedActivities: [],
  selectedServices: [],
  checkIn: "2026-11-10",
  checkOut: "2026-11-13",
  guests: 2,
  depositPercent: 30,
  minNights: 1,
  today: "2026-11-01",
};

describe("fechas", () => {
  it("calcula noches entre dos fechas", () => {
    expect(nightsBetween("2026-11-10", "2026-11-13")).toBe(3);
    expect(nightsBetween("2026-02-28", "2026-03-02")).toBe(2);
    expect(nightsBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(nightsBetween("2026-11-13", "2026-11-10")).toBe(-3);
  });

  it("suma y resta días cruzando meses y años", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("rechaza fechas de calendario inválidas", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("2026-13-01")).toBeNull();
    expect(parseDateOnly("10/11/2026")).toBeNull();
    expect(parseDateOnly("2026-11-10")).not.toBeNull();
  });

  it("entrega la fecha actual de Colombia en formato ISO", () => {
    expect(todayInColombia()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("redondeo y formato COP", () => {
  it("redondea a la centena más cercana", () => {
    expect(roundCOP(1_234)).toBe(1_200);
    expect(roundCOP(1_250)).toBe(1_300);
    expect(roundCOP(0)).toBe(0);
  });

  it("formatea pesos colombianos sin decimales", () => {
    const formatted = formatCOP(1_234_500);
    expect(formatted).toContain("1.234.500");
    expect(formatted).not.toContain(",00");
  });
});

describe("calculateQuote", () => {
  it("calcula una estadía base y el anticipo", () => {
    const quote = calculateQuote(baseInput);
    expect(quote.nights).toBe(3);
    expect(quote.nightlyRate).toBe(300_000);
    expect(quote.subtotal).toBe(900_000);
    expect(quote.total).toBe(900_000);
    expect(quote.depositRequired).toBe(270_000);
    expect(quote.rateName).toBe("Tarifa base");
    expect(quote.nightlyBreakdown).toHaveLength(3);
  });

  it("aplica tarifas de temporada y noches mínimas", () => {
    const rates = [
      {
        name: "Temporada alta",
        startDate: "2026-12-20",
        endDate: "2027-01-05",
        pricePerNight: 400_000,
        minNights: 2,
        active: true,
      },
    ];
    const quote = calculateQuote({
      ...baseInput,
      rates,
      checkIn: "2026-12-30",
      checkOut: "2027-01-02",
    });
    expect(quote.subtotal).toBe(1_200_000);
    expect(quote.rateName).toBe("Temporada alta");

    expect(() =>
      calculateQuote({
        ...baseInput,
        rates,
        checkIn: "2026-12-30",
        checkOut: "2026-12-31",
      }),
    ).toThrowError(QuoteError);
  });

  it("suma actividades y servicios con sus cantidades", () => {
    const quote = calculateQuote({
      ...baseInput,
      selectedActivities: [{ activityId: "a1", quantity: 2 }],
      selectedServices: [{ serviceId: "s1", quantity: 1 }],
    });
    expect(quote.activitiesTotal).toBe(160_000);
    expect(quote.servicesTotal).toBe(50_000);
    expect(quote.total).toBe(1_110_000);
    expect(quote.depositRequired).toBe(333_000);
    expect(quote.activityLines[0]?.name).toBe("Rafting");
  });

  it("rechaza capacidad excedida", () => {
    expect(() => calculateQuote({ ...baseInput, guests: 5 })).toThrow(/capacidad|huéspedes/i);
  });

  it("rechaza fechas pasadas, invertidas o iguales", () => {
    expect(() => calculateQuote({ ...baseInput, checkIn: "2026-10-31" })).toThrow(/pasado/i);
    expect(() => calculateQuote({ ...baseInput, checkOut: "2026-11-10" })).toThrow(/posterior/i);
    expect(() => calculateQuote({ ...baseInput, checkOut: "2026-11-09" })).toThrow(/posterior/i);
  });

  it("rechaza extras inactivos o cantidades inválidas", () => {
    expect(() =>
      calculateQuote({
        ...baseInput,
        activities: [{ id: "a1", name: "Rafting", price: 80_000, active: false, maxPeople: 4 }],
        selectedActivities: [{ activityId: "a1", quantity: 1 }],
      }),
    ).toThrow(/actividad/i);

    expect(() =>
      calculateQuote({
        ...baseInput,
        selectedActivities: [{ activityId: "a1", quantity: 3 }],
      }),
    ).toThrow(/máximo/i);
  });

  it("exige la estadía mínima general", () => {
    expect(() =>
      calculateQuote({
        ...baseInput,
        checkIn: "2026-11-10",
        checkOut: "2026-11-11",
        minNights: 2,
      }),
    ).toThrow(/mínima/i);
  });
});

describe("festivos colombianos", () => {
  it("reconoce festivos fijos, Emiliani y de Semana Santa", () => {
    expect(getColombianHoliday("2026-01-01")).toBe("Año Nuevo");
    expect(getColombianHoliday("2026-01-12")).toBe("Reyes Magos");
    expect(getColombianHoliday("2026-04-02")).toBe("Jueves Santo");
    expect(getColombianHoliday("2026-04-03")).toBe("Viernes Santo");
    expect(getColombianHoliday("2026-05-18")).toBe("Ascensión del Señor");
    expect(getColombianHoliday("2026-11-16")).toBe("Independencia de Cartagena");
    expect(getColombianHoliday("2026-11-10")).toBeNull();
  });

  it("identifica sábados y domingos", () => {
    expect(isWeekend("2026-11-14")).toBe(true); // sábado
    expect(isWeekend("2026-11-15")).toBe(true); // domingo
    expect(isWeekend("2026-11-16")).toBe(false); // lunes festivo
    expect(isWeekend("2026-02-30")).toBe(false);
  });

  it("lista los festivos ordenados", () => {
    const holidays = listColombianHolidays(2026);
    expect(holidays.length).toBeGreaterThanOrEqual(18);
    expect(holidays[0]?.date).toBe("2026-01-01");
    expect(holidays.at(-1)?.date).toBe("2026-12-25");
  });
});

describe("tarifas de fin de semana y festivos", () => {
  const priced = {
    ...glamping,
    pricePerNight: 300_000,
    weekendPricePerNight: 350_000,
    holidayPricePerNight: 420_000,
  };

  it("cobra fin de semana solo las noches de sábado y domingo", () => {
    // Vie 13 (base), sáb 14 (fin de semana).
    const quote = calculateQuote({
      ...baseInput,
      glamping: priced,
      checkIn: "2026-11-13",
      checkOut: "2026-11-15",
    });
    expect(quote.subtotal).toBe(650_000);
    expect(quote.nightlyBreakdown.map((night) => night.kind)).toEqual(["base", "weekend"]);
    expect(quote.rateName).toBe("Tarifa base + Tarifa fin de semana");
  });

  it("cobra tarifa de festivo en un lunes festivo", () => {
    const quote = calculateQuote({
      ...baseInput,
      glamping: priced,
      checkIn: "2026-11-16",
      checkOut: "2026-11-17",
    });
    expect(quote.subtotal).toBe(420_000);
    expect(quote.nightlyBreakdown[0]?.kind).toBe("holiday");
    expect(quote.rateName).toContain("Festivo");
  });

  it("el festivo tiene prioridad sobre el fin de semana", () => {
    // 7 de agosto de 2027: sábado y festivo (Batalla de Boyacá).
    const quote = calculateQuote({
      ...baseInput,
      glamping: priced,
      checkIn: "2027-08-07",
      checkOut: "2027-08-08",
      today: "2026-11-01",
    });
    expect(quote.subtotal).toBe(420_000);
    expect(quote.nightlyBreakdown[0]?.kind).toBe("holiday");
  });

  it("la temporada tiene prioridad sobre festivo y fin de semana", () => {
    const quote = calculateQuote({
      ...baseInput,
      glamping: priced,
      rates: [
        {
          name: "Temporada especial",
          startDate: "2026-11-14",
          endDate: "2026-11-16",
          pricePerNight: 500_000,
          minNights: 1,
          active: true,
        },
      ],
      checkIn: "2026-11-14",
      checkOut: "2026-11-17",
      today: "2026-11-01",
    });
    expect(quote.subtotal).toBe(1_500_000);
    expect(quote.nightlyBreakdown.every((night) => night.kind === "seasonal")).toBe(true);
  });

  it("usa la tarifa base si no hay tarifa de fin de semana o festivo", () => {
    const quote = calculateQuote({
      ...baseInput,
      checkIn: "2026-11-13",
      checkOut: "2026-11-15",
    });
    expect(quote.subtotal).toBe(600_000);
    // La noche del sábado se clasifica como fin de semana, pero al no haber
    // tarifa configurada se cobra el precio base.
    expect(quote.nightlyBreakdown.map((night) => night.price)).toEqual([300_000, 300_000]);
    expect(quote.nightlyBreakdown[1]?.kind).toBe("weekend");
  });
});

describe("precio de actividades por fecha de llegada", () => {
  const activity = {
    id: "a1",
    name: "Rafting",
    price: 80_000,
    weekendPrice: 95_000,
    holidayPrice: 110_000,
    active: true,
    maxPeople: 4,
  };

  it("usa la tarifa base entre semana", () => {
    expect(getActivityUnitPrice(activity, "2026-11-10").unitPrice).toBe(80_000);
    expect(getActivityUnitPrice(activity, "2026-11-10").priceKind).toBe("base");
  });

  it("usa la tarifa de fin de semana en sábado o domingo", () => {
    const result = getActivityUnitPrice(activity, "2026-11-14");
    expect(result.unitPrice).toBe(95_000);
    expect(result.priceKind).toBe("weekend");
  });

  it("usa la tarifa de festivo en un festivo colombiano", () => {
    const result = getActivityUnitPrice(activity, "2026-11-16");
    expect(result.unitPrice).toBe(110_000);
    expect(result.priceKind).toBe("holiday");
    expect(result.priceLabel).toContain("Independencia de Cartagena");
  });

  it("el festivo tiene prioridad sobre el fin de semana", () => {
    const result = getActivityUnitPrice(activity, "2027-08-07");
    expect(result.unitPrice).toBe(110_000);
    expect(result.priceKind).toBe("holiday");
  });

  it("cae a la tarifa base si la tarifa especial no está configurada", () => {
    const result = getActivityUnitPrice({ ...activity, weekendPrice: null, holidayPrice: null }, "2026-11-16");
    expect(result.unitPrice).toBe(80_000);
    expect(result.priceKind).toBe("base");
  });

  it("aplica el precio de actividad en la cotización", () => {
    const quote = calculateQuote({
      ...baseInput,
      activities: [activity],
      selectedActivities: [{ activityId: "a1", quantity: 2 }],
      checkIn: "2026-11-14",
      checkOut: "2026-11-15",
    });
    expect(quote.activitiesTotal).toBe(190_000);
    expect(quote.activityLines[0]?.priceKind).toBe("weekend");
    expect(quote.activityLines[0]?.priceLabel).toBe("Tarifa fin de semana");
  });
});
