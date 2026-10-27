import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteService, getServiceById, updateService } from "@/lib/data/catalog";
import { serviceSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    if (!(await getServiceById(id))) return jsonError("Servicio no encontrado.", 404);
    const parsed = serviceSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const service = await updateService(id, parsed.data);
    return NextResponse.json({ service });
  } catch (error) {
    return handleApiError(error, "update service");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const result = await deleteService(id);
    if (result === "not_found") return jsonError("Servicio no encontrado.", 404);
    return NextResponse.json({
      result,
      message: result === "deactivated" ? "El servicio tiene reservas asociadas; se desactivó." : "Servicio eliminado.",
    });
  } catch (error) {
    return handleApiError(error, "delete service");
  }
}
