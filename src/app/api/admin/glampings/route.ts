import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createGlamping } from "@/lib/data/glampings";
import { glampingSchema } from "@/lib/validation";
import { slugify } from "@/lib/data/helpers";
import { isUniqueViolation } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const parsed = glampingSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const data = parsed.data;
    const slug = data.slug || slugify(data.name);
    const glamping = await createGlamping({ ...data, slug });
    return NextResponse.json({ glamping }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ya existe un glamping con ese nombre o slug.", 409);
    return handleApiError(error, "create glamping");
  }
}
