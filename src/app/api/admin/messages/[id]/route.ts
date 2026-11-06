import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Estado inválido");
    await query("update contact_messages set status = ? where id = ?", [parsed.data.status, id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "update message");
  }
}
