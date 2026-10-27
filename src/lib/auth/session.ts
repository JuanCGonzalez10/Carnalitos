import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import type { AdminUser } from "@/types";

export const SESSION_COOKIE = "aeh_admin_session";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query(
    `insert into admin_sessions (token_hash, user_id, expires_at) values ($1,$2,$3)`,
    [hashToken(token), userId, expiresAt],
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await queryOne<AdminUser>(
    `select u.id, u.name, u.email, u.role, u.active, u.last_login_at as "lastLoginAt"
     from admin_sessions s
     join admin_users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now() and u.active = true`,
    [hashToken(token)],
  );
  return user;
}

export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("delete from admin_sessions where token_hash = $1", [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}

export async function cleanupSessions(): Promise<void> {
  await query("delete from admin_sessions where expires_at < now()");
}

export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host");
    return originUrl.host === host;
  } catch {
    return false;
  }
}
