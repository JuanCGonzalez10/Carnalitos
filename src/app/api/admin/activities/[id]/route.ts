import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteActivity, getActivityById, updateActivity } from "@/lib/data/catalog";
import { activitySchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    if (!(await getActivityById(id))) return jsonError("Actividad no encontrada.", 404);
    const parsed = activitySchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = { ...parsed.data };
    if (data.name && !data.slug) data.slug = slugify(data.name);
    const activity = await updateActivity(id, data);
    return NextResponse.json({ activity });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe una actividad con ese slug.", 409);
    return handleApiError(error, "update activity");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const result = await deleteActivity(id);
    if (result === "not_found") return jsonError("Actividad no encontrada.", 404);
    return NextResponse.json({
      result,
      message: result === "deactivated" ? "La actividad tiene reservas asociadas; se desactivó." : "Actividad eliminada.",
    });
  } catch (error) {
    return handleApiError(error, "delete activity");
  }
}
