import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { deleteGalleryImage, updateGalleryImage } from "@/lib/data/catalog";

export const runtime = "nodejs";

const schema = z.object({
  alt: z.string().max(200).optional(),
  category: z.string().max(60).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Datos inválidos");
    const image = await updateGalleryImage(id, parsed.data);
    return NextResponse.json({ image });
  } catch (error) {
    return handleApiError(error, "update gallery image");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    await deleteGalleryImage(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "delete gallery image");
  }
}
