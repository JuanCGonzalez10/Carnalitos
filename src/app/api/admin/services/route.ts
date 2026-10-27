import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createService } from "@/lib/data/catalog";
import { serviceSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = serviceSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const service = await createService(parsed.data);
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "create service");
  }
}
