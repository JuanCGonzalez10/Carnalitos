import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { uploadDirectory } from "@/lib/storage";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return new NextResponse("No encontrado", { status: 404 });
  }
  const type = TYPES[extname(filename).toLowerCase()];
  if (!type) return new NextResponse("No encontrado", { status: 404 });
  try {
    const file = await readFile(resolve(uploadDirectory(), filename));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
