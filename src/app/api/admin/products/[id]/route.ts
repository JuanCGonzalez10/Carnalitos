import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteProduct, updateProduct } from "@/lib/data/products";
import { productQuickUpdateSchema, productSchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const isFullUpdate = typeof body.name === "string" && body.price !== undefined;

    if (isFullUpdate) {
      const parsed = productSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      const data = parsed.data;
      const product = await updateProduct(id, {
        ...data,
        slug: data.slug || slugify(data.name),
      });
      return NextResponse.json({ product });
    }

    const parsed = productQuickUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const product = await updateProduct(id, parsed.data);
    return NextResponse.json({ product });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe un producto con ese slug.", 409);
    return handleApiError(error, "update product");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const result = await deleteProduct(id);
    if (result === "not_found") return jsonError("Producto no encontrado", 404);
    return NextResponse.json({
      result,
      message:
        result === "deleted"
          ? "Producto eliminado."
          : "El producto tiene pedidos asociados, así que quedó desactivado.",
    });
  } catch (error) {
    return handleApiError(error, "delete product");
  }
}
