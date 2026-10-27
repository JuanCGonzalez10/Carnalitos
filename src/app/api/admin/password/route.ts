import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { query, queryOne } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { passwordSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    const user = await queryOne<{ passwordHash: string }>(
      "select password_hash as \"passwordHash\" from admin_users where id = $1",
      [auth.user.id],
    );
    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      return jsonError("La contraseña actual no es correcta.", 401);
    }
    await query("update admin_users set password_hash = $1 where id = $2", [
      hashPassword(parsed.data.newPassword),
      auth.user.id,
    ]);
    await query("delete from admin_sessions where user_id = $1", [auth.user.id]);
    await createSession(auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "change password");
  }
}
