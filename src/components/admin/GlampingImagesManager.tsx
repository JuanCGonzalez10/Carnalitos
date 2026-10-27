"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { IMAGE_ACCEPT, uploadImageFile, validateImageFile } from "@/lib/uploads";
import type { GlampingImage } from "@/types";

export default function GlampingImagesManager({
  glampingId,
  glampingName,
  initial,
  onImagesChange,
}: {
  glampingId: string;
  glampingName: string;
  initial: GlampingImage[];
  onImagesChange?: (images: GlampingImage[]) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Mantiene el estado local sincronizado cuando el servidor entrega datos
  // nuevos (por ejemplo, al cambiar de pestaña o después de router.refresh()).
  useEffect(() => {
    setImages(initial);
  }, [initial]);

  function applyImages(next: GlampingImage[]) {
    setImages(next);
    onImagesChange?.(next);
  }

  async function uploadFiles(files: File[]) {
    const valid = files.filter((file) => !validateImageFile(file));
    if (valid.length === 0) {
      const firstError = files.length ? validateImageFile(files[0]) : null;
      setMessage({ type: "error", text: firstError || "Selecciona al menos una imagen válida." });
      return;
    }

    setUploading(true);
    setMessage(null);
    let latest = images;
    let added = 0;
    const errors: string[] = [];

    for (const file of valid) {
      try {
        const uploadData = await uploadImageFile(file);
        const addResponse = await fetch(`/api/admin/glampings/${glampingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploadData.url, alt: glampingName }),
        });
        const addData = await addResponse.json();
        if (!addResponse.ok) throw new Error(addData.error || "No se pudo guardar la imagen.");
        latest = addData.images as GlampingImage[];
        added += 1;
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "error desconocido"}`);
      }
    }

    if (added > 0) {
      applyImages(latest);
      router.refresh();
    }

    if (errors.length > 0) {
      setMessage({
        type: "error",
        text: `${added > 0 ? `Se agregaron ${added} imagen${added === 1 ? "" : "es"}. ` : ""}No se pudieron subir: ${errors.join(" · ")}`,
      });
    } else {
      setMessage({ type: "ok", text: `${added} imagen${added === 1 ? "" : "es"} agregada${added === 1 ? "" : "s"}.` });
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function persist(next: GlampingImage[]) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: next.map((image, index) => ({ id: image.id, sortOrder: index, isMain: image.isMain })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el orden.");
      applyImages(data.images as GlampingImage[]);
      router.refresh();
    } catch (error) {
      setImages(images);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el orden." });
    } finally {
      setBusy(false);
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next);
    void persist(next);
  }

  function setMain(id: string) {
    const next = images.map((image) => ({ ...image, isMain: image.id === id }));
    setImages(next);
    void persist(next);
  }

  async function remove(image: GlampingImage) {
    if (!window.confirm("¿Eliminar esta foto? Esta acción no se puede deshacer.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/images?imageId=${image.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la foto.");
      applyImages(data.images as GlampingImage[]);
      setMessage({ type: "ok", text: "Foto eliminada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar la foto." });
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || uploading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl uppercase">Fotos del alojamiento</h2>
          <p className="mt-1 text-sm text-ink/50">Arrastra las fotos para ordenarlas. La marcada como principal se usa en el catálogo y la portada.</p>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/35">{images.length} foto{images.length === 1 ? "" : "s"}</span>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length) void uploadFiles(files);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-jungle-500 bg-jungle-50" : "border-ink/15 bg-cream-50"
        }`}
      >
        <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="inline-flex flex-col items-center gap-2 disabled:cursor-wait">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-jungle-700 shadow-sm">
            {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" /> : <Icon name="upload" className="h-5 w-5" />}
          </span>
          <span className="text-[12px] font-bold text-ink/65">{uploading ? "Subiendo fotos..." : "Arrastra fotos aquí o haz clic para elegirlas"}</span>
          <span className="text-[10px] text-ink/35">Puedes subir varias a la vez · JPG, PNG, WebP, GIF o AVIF · máx. 20 MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void uploadFiles(files);
          }}
        />
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/15 py-12 text-center">
          <Icon name="image" className="mx-auto h-8 w-8 text-ink/20" />
          <p className="mt-2 text-sm text-ink/40">Aún no hay fotos. Sube la primera para que aparezca en el sitio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (disabled) return;
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={`group overflow-hidden rounded-xl border bg-white transition ${
                image.isMain ? "border-jungle-600 ring-2 ring-lime-400/40" : "border-ink/10"
              } ${dragIndex === index ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-[4/3] bg-cream-200">
                <SmartImage src={image.url} alt={image.alt || glampingName} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
                {image.isMain && <span className="absolute left-2 top-2 badge bg-lime-400 text-ink">Principal</span>}
                <span className="absolute right-2 top-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-ink/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100" title="Arrastrar para reordenar">
                  <Icon name="drag" className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0 || disabled} className="flex h-7 w-7 items-center justify-center rounded text-ink/40 transition hover:bg-cream-100 hover:text-ink disabled:opacity-20" aria-label="Mover antes">
                    <Icon name="chevron-left" className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={index === images.length - 1 || disabled} className="flex h-7 w-7 items-center justify-center rounded text-ink/40 transition hover:bg-cream-100 hover:text-ink disabled:opacity-20" aria-label="Mover después">
                    <Icon name="chevron-right" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {!image.isMain && (
                    <button type="button" onClick={() => setMain(image.id)} disabled={disabled} className="rounded px-2 py-1 text-[8px] font-extrabold uppercase tracking-widest text-jungle-700 transition hover:bg-jungle-50 disabled:opacity-30">
                      Principal
                    </button>
                  )}
                  <button type="button" onClick={() => remove(image)} disabled={disabled} className="flex h-7 w-7 items-center justify-center rounded text-ink/30 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Eliminar foto">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
