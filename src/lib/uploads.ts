// Utilidades de carga de imágenes para el panel de administración.
// Se ejecutan en el navegador: validan el archivo, convierten formatos que el
// navegador puede leer (por ejemplo HEIC en Safari) y reducen fotos muy grandes
// antes de enviarlas al servidor.

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const CONVERTIBLE_MIME = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const ACCEPTED_EXTENSION = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i;

export function isAcceptedImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  return ACCEPTED_MIME.has(type) || CONVERTIBLE_MIME.has(type) || ACCEPTED_EXTENSION.test(file.name);
}

export function validateImageFile(file: File): string | null {
  if (!file.size) return "El archivo está vacío.";
  if (!isAcceptedImageFile(file)) {
    return "Formato no permitido. Usa JPG, PNG, WebP, GIF o AVIF.";
  }
  if (file.type === "image/gif" && file.size > MAX_IMAGE_BYTES) {
    return "El GIF supera el límite de 20 MB. Usa uno más liviano.";
  }
  return null;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Algunos navegadores no pueden decodificar ciertos formatos con
      // createImageBitmap; se intenta con un elemento <img>.
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos leer la imagen. Conviértela a JPG o PNG e inténtalo de nuevo."));
    };
    image.src = url;
  });
}

function imageSize(image: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if ("naturalWidth" in image) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: image.width, height: image.height };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No pudimos procesar la imagen."));
      },
      type,
      quality,
    );
  });
}

async function resizeImage(file: File, maxDimension: number, quality: number): Promise<File> {
  const image = await decodeImage(file);
  const { width, height } = imageSize(image);
  if (!width || !height) throw new Error("La imagen no tiene dimensiones válidas.");

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pudimos procesar la imagen.");

  // Fondo blanco para formatos sin transparencia (JPEG/HEIC).
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image as CanvasImageSource, 0, 0, targetWidth, targetHeight);

  const prefersPng = file.type === "image/png";
  const outputType = prefersPng ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, outputType, quality);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  const extension = prefersPng ? "png" : "jpg";
  return new File([blob], `${baseName}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

/**
 * Prepara un archivo para subirlo. Si ya es un formato soportado y pesa menos
 * de 20 MB, se devuelve igual. Si es HEIC/HEIF o supera el tamaño, se convierte
 * a JPG/PNG y se reduce a un máximo de 2400 px.
 */
export async function prepareImageFile(file: File): Promise<File> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const type = file.type.toLowerCase();
  const needsConversion = CONVERTIBLE_MIME.has(type) || (!ACCEPTED_MIME.has(type) && ACCEPTED_EXTENSION.test(file.name));
  if (!needsConversion && file.size <= MAX_IMAGE_BYTES) return file;

  // Los GIF animados no se convierten porque perderían la animación.
  if (type === "image/gif") {
    throw new Error("El GIF supera el límite de 20 MB. Usa uno más liviano.");
  }

  let prepared = await resizeImage(file, 2400, 0.9);
  if (prepared.size > MAX_IMAGE_BYTES) {
    prepared = await resizeImage(prepared, 1600, 0.82);
  }
  if (prepared.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen sigue siendo demasiado grande después de reducirla. Usa una foto más liviana.");
  }
  return prepared;
}

export async function uploadImageFile(file: File): Promise<{ url: string; filename: string; size: number }> {
  const prepared = await prepareImageFile(file);
  const form = new FormData();
  form.append("file", prepared);

  let response: Response;
  try {
    response = await fetch("/api/admin/upload", { method: "POST", body: form });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }

  let data: { url?: string; filename?: string; size?: number; error?: string };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new Error("El servidor devolvió una respuesta inesperada al subir la imagen.");
  }

  if (!response.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir la imagen.");
  }

  return {
    url: data.url,
    filename: data.filename ?? "",
    size: data.size ?? prepared.size,
  };
}
