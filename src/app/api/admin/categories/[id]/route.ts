import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteCategory, updateCategory } from "@/lib/data/products";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = parsed.data;
    const category = await updateCategory(id, { ...data, slug: data.slug || slugify(data.name) });
    return NextResponse.json({ category });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe una categoría con ese slug.", 409);
    return handleApiError(error, "update category");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const result = await deleteCategory(id);
    if (result === "not_found") return jsonError("Categoría no encontrada", 404);
    return NextResponse.json({
      result,
      message:
        result === "deleted"
          ? "Categoría eliminada."
          : "La categoría tiene productos, así que quedó desactivada.",
    });
  } catch (error) {
    return handleApiError(error, "delete category");
  }
}
