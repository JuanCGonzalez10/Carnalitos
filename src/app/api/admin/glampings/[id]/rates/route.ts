import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { addGlampingRate, deleteGlampingRate, getGlampingRates } from "@/lib/data/glampings";
import { rateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = rateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Tarifa inválida");
    if (parsed.data.endDate < parsed.data.startDate) return jsonError("La fecha final debe ser posterior.");
    const rate = await addGlampingRate(id, parsed.data);
    return NextResponse.json({ rate, rates: await getGlampingRates(id) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "add rate");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const rateId = new URL(request.url).searchParams.get("rateId");
    if (!rateId) return jsonError("Falta la tarifa.");
    await deleteGlampingRate(id, rateId);
    return NextResponse.json({ rates: await getGlampingRates(id) });
  } catch (error) {
    return handleApiError(error, "delete rate");
  }
}
