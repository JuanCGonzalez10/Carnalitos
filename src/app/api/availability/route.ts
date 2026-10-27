import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking/availability";
import { nightsBetween, parseDateOnly, todayInColombia } from "@/lib/booking/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const guests = Number(searchParams.get("guests") ?? 2);

  if (!parseDateOnly(checkIn) || !parseDateOnly(checkOut)) {
    return NextResponse.json({ error: "Selecciona fechas válidas." }, { status: 400 });
  }
  if (checkIn < todayInColombia()) {
    return NextResponse.json({ error: "La llegada no puede estar en el pasado." }, { status: 400 });
  }
  if (nightsBetween(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: "La salida debe ser posterior a la llegada." }, { status: 400 });
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 30) {
    return NextResponse.json({ error: "Número de huéspedes inválido." }, { status: 400 });
  }

  try {
    const items = await getAvailability({ checkIn, checkOut, guests });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("availability", error);
    return NextResponse.json({ error: "No se pudo consultar la disponibilidad." }, { status: 500 });
  }
}
