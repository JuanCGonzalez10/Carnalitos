import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { updateOrder } from "@/lib/data/orders";
import { orderUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = orderUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const order = await updateOrder(id, parsed.data);
    if (!order) return jsonError("Pedido no encontrado", 404);
    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error, "update order");
  }
}
