import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import type { AdminUser } from "@/types";

export const SESSION_COOKIE = "carnalitos_admin_session";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query(
    `insert into admin_sessions (id, token_hash, user_id, expires_at)
     values (?,?,?, date_add(now(), interval ${SESSION_DAYS} day))`,
    [randomUUID(), hashToken(token), userId],
  );
  const store = await cookies();
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = headerStore.get("host") ?? "";
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const secure = forwardedProto ? forwardedProto === "https" : process.env.NODE_ENV === "production" && !isLocalHost;
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
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
    `select u.id, u.name, u.email, u.role, u.active, u.last_login_at as \`lastLoginAt\`
     from admin_sessions s
     join admin_users u on u.id = s.user_id
     where s.token_hash = ? and s.expires_at > now() and u.active = 1`,
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
    await query("delete from admin_sessions where token_hash = ?", [hashToken(token)]);
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
    const candidates = new Set<string>();

    const addHost = (value: string | null | undefined) => {
      if (!value) return;
      for (const part of value.split(",")) {
        const trimmed = part.trim();
        if (trimmed) candidates.add(trimmed);
      }
    };

    // Hostinger puede enviar el host real en Host o en X-Forwarded-Host.
    addHost(request.headers.get("host"));
    addHost(request.headers.get("x-forwarded-host"));

    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (configured) {
      try {
        addHost(new URL(configured).host);
      } catch {
        // NEXT_PUBLIC_APP_URL inválida: se ignoran las comparaciones extra.
      }
    }

    if (candidates.has(originUrl.host)) return true;
    if (process.env.NODE_ENV !== "production") {
      if (originUrl.hostname.endsWith(".trycloudflare.com")) return true;
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return true;
    }
    return false;
  } catch {
    return false;
  }
}
