import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import {
  addGlampingImage,
  deleteGlampingImage,
  getGlampingById,
  getGlampingImages,
  reorderGlampingImages,
} from "@/lib/data/glampings";

export const runtime = "nodejs";

const addSchema = z.object({
  url: z.string().min(1).max(500),
  alt: z.string().max(200).optional().default(""),
});

const reorderSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.coerce.number().int().min(0),
        isMain: z.boolean(),
      }),
    )
    .min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const glamping = await getGlampingById(id);
    if (!glamping) return jsonError("Glamping no encontrado.", 404);
    const parsed = addSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Datos de imagen inválidos.");
    const image = await addGlampingImage(id, parsed.data.url, parsed.data.alt);
    return NextResponse.json({ image, images: await getGlampingImages(id) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "add glamping image");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const parsed = reorderSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Orden de imágenes inválido.");
    await reorderGlampingImages(id, parsed.data.images);
    return NextResponse.json({ images: await getGlampingImages(id) });
  } catch (error) {
    return handleApiError(error, "reorder glamping images");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await params;
    const imageId = new URL(request.url).searchParams.get("imageId");
    if (!imageId) return jsonError("Falta la imagen.");
    await deleteGlampingImage(id, imageId);
    return NextResponse.json({ images: await getGlampingImages(id) });
  } catch (error) {
    return handleApiError(error, "delete glamping image");
  }
}
