import { NextResponse } from "next/server";
import { assertSameOrigin, getAdminUser } from "@/lib/auth/session";
import type { AdminUser } from "@/types";

export type ApiAuth = { user: AdminUser } | { error: NextResponse };

export async function requireAdminApi(request: Request): Promise<ApiAuth> {
  if (!assertSameOrigin(request)) {
    return { error: NextResponse.json({ error: "Origen no permitido" }, { status: 403 }) };
  }
  const user = await getAdminUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  return { user };
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(context, error);
  return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
}
