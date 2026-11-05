import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createCategory } from "@/lib/data/products";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = parsed.data;
    const category = await createCategory({ ...data, slug: data.slug || slugify(data.name) });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe una categoría con ese slug.", 409);
    return handleApiError(error, "create category");
  }
}
