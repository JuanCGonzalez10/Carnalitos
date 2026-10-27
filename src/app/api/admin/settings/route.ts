import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { updateSettingsSection } from "@/lib/settings";
import { bookingSettingsSchema, businessSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    if (body.business) {
      const parsed = businessSettingsSchema.safeParse(body.business);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos del negocio inválidos");
      await updateSettingsSection("business", parsed.data);
    }
    if (body.booking) {
      const parsed = bookingSettingsSchema.safeParse(body.booking);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Datos de reservas inválidos");
      await updateSettingsSection("booking", parsed.data);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "update settings");
  }
}
