import { NextResponse } from "next/server";
import { getGlampingById } from "@/lib/data/glampings";
import { quoteForGlamping, isGlampingAvailable } from "@/lib/booking/availability";
import { QuoteError } from "@/lib/booking/pricing";
import { quoteSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa las fechas, huéspedes y extras.", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const glamping = await getGlampingById(data.glampingId, false);
  if (!glamping) return NextResponse.json({ error: "Alojamiento no encontrado." }, { status: 404 });

  try {
    const quote = await quoteForGlamping({
      glamping,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      selectedActivities: data.activities,
      selectedServices: data.services,
    });
    const availability = await isGlampingAvailable(glamping.id, data.checkIn, data.checkOut);
    return NextResponse.json({
      quote,
      available: availability.available,
      reason: availability.reason,
      glamping: { id: glamping.id, name: glamping.name, capacity: glamping.capacity },
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("quote", error);
    return NextResponse.json({ error: "No se pudo calcular el precio." }, { status: 500 });
  }
}
