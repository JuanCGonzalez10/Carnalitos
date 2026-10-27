import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Recibimos varios mensajes tuyos. Espera unos minutos." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los datos del formulario." }, { status: 400 });
  }
  const data = parsed.data;
  await query(
    `insert into contact_messages (name, email, phone, subject, message)
     values ($1,$2,$3,$4,$5)`,
    [data.name, data.email, data.phone, data.subject, data.message],
  );
  return NextResponse.json({ ok: true });
}
