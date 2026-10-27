import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { getBookingById } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { buildReceiptPdf } from "@/lib/pdf/receipt";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return jsonError("Reserva no encontrada.", 404);
    const settings = await getSettings();
    const pdf = await buildReceiptPdf(booking, settings.business.name);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${booking.code}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "receipt pdf");
  }
}
