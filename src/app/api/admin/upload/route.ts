import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdminApi, jsonError, handleApiError } from "@/lib/api/guard";
import { uploadDirectory } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 20 * 1024 * 1024;

interface DetectedImage {
  mime: string;
  extension: string;
}

function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  // PNG
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.subarray(0, 8).equals(pngSignature)) {
    return { mime: "image/png", extension: "png" };
  }

  // WebP
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }

  // GIF
  const header = buffer.subarray(0, 6).toString();
  if (header === "GIF87a" || header === "GIF89a") {
    return { mime: "image/gif", extension: "gif" };
  }

  // AVIF (contenedor ISO BMFF: "ftyp" + marca avif/avis)
  if (buffer.subarray(4, 8).toString() === "ftyp") {
    const brand = buffer.subarray(8, 12).toString();
    if (brand === "avif" || brand === "avis") {
      return { mime: "image/avif", extension: "avif" };
    }
    // HEIC/HEIF: se detecta para devolver un mensaje claro, pero no se acepta
    // porque la mayoría de navegadores no lo puede mostrar directamente.
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) {
      return { mime: "image/heic", extension: "heic" };
    }
  }

  return null;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Selecciona una imagen.");
    if (file.size <= 0) return jsonError("El archivo está vacío.");
    if (file.size > MAX_SIZE) return jsonError("La imagen supera el límite de 20 MB.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageType(buffer);
    if (!detected) {
      return jsonError("El archivo no parece una imagen válida. Usa JPG, PNG, WebP, GIF o AVIF.");
    }
    if (detected.mime === "image/heic") {
      return jsonError(
        "Las fotos HEIC/HEIF no se pueden mostrar en la mayoría de navegadores. Convierte la imagen a JPG o PNG e inténtalo de nuevo.",
      );
    }

    const dir = uploadDirectory();
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${detected.extension}`;
    await writeFile(resolve(dir, filename), buffer);

    return NextResponse.json({
      url: `/api/media/${filename}`,
      filename,
      size: file.size,
      type: detected.mime,
    });
  } catch (error) {
    return handleApiError(error, "upload");
  }
}
