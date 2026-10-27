import { NextResponse } from "next/server";
import { getBookingByCode } from "@/lib/data/bookings";
import { rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!code || !email) {
    return NextResponse.json({ error: "Ingresa el código de reserva y el correo con el que reservaste." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`lookup:${ip}`, 20, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  try {
    const booking = await getBookingByCode(code);
    if (!booking || booking.guestEmail.trim().toLowerCase() !== email) {
      return NextResponse.json(
        { error: "No encontramos una reserva con ese código y correo. Revisa los datos o escríbenos por WhatsApp." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      booking: {
        ...booking,
        adminNotes: undefined,
        history: undefined,
      },
    });
  } catch (error) {
    console.error("booking lookup", error);
    return NextResponse.json({ error: "No se pudo consultar la reserva. Intenta nuevamente." }, { status: 500 });
  }
}
