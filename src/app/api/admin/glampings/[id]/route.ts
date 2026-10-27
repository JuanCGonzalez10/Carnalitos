import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteGlamping, getGlampingById, updateGlamping } from "@/lib/data/glampings";
import { glampingSchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const existing = await getGlampingById(id);
    if (!existing) return jsonError("Glamping no encontrado.", 404);
    const body = await request.json();
    const parsed = glampingSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = { ...parsed.data };
    if (data.name && !data.slug) data.slug = slugify(data.name);
    const glamping = await updateGlamping(id, data);
    return NextResponse.json({ glamping });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe un glamping con ese slug.", 409);
    return handleApiError(error, "update glamping");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const result = await deleteGlamping(id);
    if (result === "not_found") return jsonError("Glamping no encontrado.", 404);
    return NextResponse.json({
      result,
      message:
        result === "deactivated"
          ? "El glamping tiene reservas asociadas; se desactivó en lugar de eliminarse."
          : "Glamping eliminado.",
    });
  } catch (error) {
    return handleApiError(error, "delete glamping");
  }
}
