import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { addBlockedDate, deleteBlockedDate, getGlampingBlocks } from "@/lib/data/glampings";
import { blockSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = blockSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Fechas inválidas");
    if (parsed.data.endDate < parsed.data.startDate) return jsonError("La fecha final debe ser posterior.");
    const block = await addBlockedDate(id, parsed.data);
    return NextResponse.json({ block, blocks: await getGlampingBlocks(id) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "add block");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const blockId = new URL(request.url).searchParams.get("blockId");
    if (!blockId) return jsonError("Falta el bloqueo.");
    await deleteBlockedDate(id, blockId);
    return NextResponse.json({ blocks: await getGlampingBlocks(id) });
  } catch (error) {
    return handleApiError(error, "delete block");
  }
}
