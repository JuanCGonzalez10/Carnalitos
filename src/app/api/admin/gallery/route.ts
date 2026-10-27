import { NextResponse } from "next/server";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { createGalleryImage } from "@/lib/data/catalog";
import { gallerySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const parsed = gallerySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Datos de imagen inválidos.");
    const image = await createGalleryImage(parsed.data);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "create gallery image");
  }
}
