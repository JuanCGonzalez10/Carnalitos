import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { addPayment, deletePayment, getBookingById } from "@/lib/data/bookings";
import { withTransaction } from "@/lib/db";
import { paymentSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return jsonError("Reserva no encontrada.", 404);
    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos del pago inválidos");
    if (parsed.data.amount > booking.balance + 1) {
      return jsonError("El pago supera el saldo pendiente. Verifica el valor.");
    }
    await withTransaction((client) =>
      addPayment(client, id, { ...parsed.data, createdBy: auth.user.email }),
    );
    return NextResponse.json({ booking: await getBookingById(id) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "add payment");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const paymentId = new URL(request.url).searchParams.get("paymentId");
    if (!paymentId) return jsonError("Falta el pago.");
    const deleted = await withTransaction((client) => deletePayment(client, id, paymentId));
    if (!deleted) return jsonError("Pago no encontrado.", 404);
    return NextResponse.json({ booking: await getBookingById(id) });
  } catch (error) {
    return handleApiError(error, "delete payment");
  }
}
