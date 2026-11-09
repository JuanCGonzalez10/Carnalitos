import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createPosSale, OrderError } from "@/lib/data/orders";
import { posSaleSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Solicitud inválida");
  }

  const parsed = posSaleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Revisa los datos de la venta.");
  }

  try {
    const order = await createPosSale(parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) return jsonError(error.message, error.status);
    return handleApiError(error, "create pos sale");
  }
}
