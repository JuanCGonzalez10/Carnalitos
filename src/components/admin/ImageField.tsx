"use client";

import { useRef, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { IMAGE_ACCEPT, uploadImageFile, validateImageFile } from "@/lib/uploads";

export default function ImageField({
  value,
  onChange,
  label = "Imagen",
  hint = "JPG, PNG, WebP, GIF o AVIF · máximo 20 MB",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    const validation = validateImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setUploading(true);
    try {
      const data = await uploadImageFile(file);
      onChange(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="admin-label">{label}</label>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (uploading) return;
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging ? "border-jungle-500 bg-jungle-50" : "border-ink/15 bg-cream-50"
        }`}
      >
        {value ? (
          <div className="relative aspect-[16/9] w-full">
            <SmartImage src={value} alt="Vista previa" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/45 text-white">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Subiendo
                </span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-ink backdrop-blur disabled:opacity-50"
              >
                Reemplazar
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={uploading}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-50"
                aria-label="Quitar imagen"
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-10 text-center disabled:cursor-wait"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-jungle-700 shadow-sm">
              {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" /> : <Icon name="upload" className="h-4 w-4" />}
            </span>
            <span className="text-[11px] font-bold text-ink/60">{uploading ? "Subiendo..." : "Arrastra una foto o haz clic para elegir"}</span>
            <span className="text-[10px] text-ink/35">{hint}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="/images/... o /api/media/..."
        className="admin-input mt-2 font-mono text-[11px]"
      />
      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
