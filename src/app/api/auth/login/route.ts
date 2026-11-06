import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { cleanupSessions, createSession } from "@/lib/auth/session";
import { clearRateLimit, rateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const limit = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(limit.retryAfter / 60)} minutos.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresa un correo y una contraseña válidos." }, { status: 400 });
  }

  const user = await queryOne<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    active: boolean;
  }>(
    `select id, name, email, password_hash as \`passwordHash\`, role, active
     from admin_users where lower(email) = lower(?)`,
    [parsed.data.email],
  );

  if (!user || !user.active || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }

  await createSession(user.id);
  await query("update admin_users set last_login_at = now() where id = ?", [user.id]);
  clearRateLimit(`login:${ip}`);
  void cleanupSessions();

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
