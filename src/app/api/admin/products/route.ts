import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createProduct } from "@/lib/data/products";
import { productSchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = parsed.data;
    const product = await createProduct({ ...data, slug: data.slug || slugify(data.name) });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe un producto con ese slug.", 409);
    return handleApiError(error, "create product");
  }
}
