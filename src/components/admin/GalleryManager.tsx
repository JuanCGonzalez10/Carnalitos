"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { IMAGE_ACCEPT, uploadImageFile, validateImageFile } from "@/lib/uploads";
import type { GalleryImage } from "@/types";

export default function GalleryManager({ initial }: { initial: GalleryImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [form, setForm] = useState({ alt: "", category: "General", active: true, sortOrder: "0" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  async function uploadFiles(files: File[]) {
    const valid = files.filter((file) => !validateImageFile(file));
    if (!valid.length) {
      const firstError = files.length ? validateImageFile(files[0]) : null;
      setMessage({ type: "error", text: firstError || "Selecciona al menos una imagen válida." });
      return;
    }
    setUploading(true);
    setMessage(null);
    let latest = items;
    let added = 0;
    const errors: string[] = [];

    for (const file of valid) {
      try {
        const uploadData = await uploadImageFile(file);
        const createResponse = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploadData.url, alt: "", category: "General" }),
        });
        const createData = await createResponse.json();
        if (!createResponse.ok) throw new Error(createData.error || "No se pudo guardar la imagen.");
        latest = [...latest, createData.image as GalleryImage];
        added += 1;
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "error desconocido"}`);
      }
    }

    if (added > 0) {
      setItems(latest);
      router.refresh();
    }

    if (errors.length > 0) {
      setMessage({
        type: "error",
        text: `${added > 0 ? `Se agregaron ${added} foto${added === 1 ? "" : "s"}. ` : ""}No se pudieron subir: ${errors.join(" · ")}`,
      });
    } else {
      setMessage({ type: "ok", text: `${added} foto${added === 1 ? "" : "s"} agregada${added === 1 ? "" : "s"}.` });
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openEditor(image: GalleryImage) {
    setEditing(image);
    setForm({ alt: image.alt, category: image.category, active: image.active, sortOrder: String(image.sortOrder) });
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/gallery/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: form.alt, category: form.category, active: form.active, sortOrder: Number(form.sortOrder) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la foto.");
      setItems((previous) => previous.map((item) => (item.id === editing.id ? (data.image as GalleryImage) : item)));
      setEditing(null);
      setMessage({ type: "ok", text: "Foto actualizada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar la foto." });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(image: GalleryImage) {
    try {
      const response = await fetch(`/api/admin/gallery/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !image.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setItems((previous) => previous.map((item) => (item.id === image.id ? (data.image as GalleryImage) : item)));
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar." });
    }
  }

  async function remove(image: GalleryImage) {
    if (!window.confirm("¿Eliminar esta foto de la galería?")) return;
    try {
      const response = await fetch(`/api/admin/gallery/${image.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la foto.");
      setItems((previous) => previous.filter((item) => item.id !== image.id));
      setMessage({ type: "ok", text: "Foto eliminada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar la foto." });
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setItems(next);
    try {
      await Promise.all(
        next.map((image, order) =>
          fetch(`/api/admin/gallery/${image.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: order }),
          }),
        ),
      );
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "No se pudo guardar el nuevo orden." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl uppercase">Fotos públicas</h2>
          <p className="mt-1 text-sm text-ink/50">Estas imágenes aparecen en la galería del sitio. Usa categorías para organizar los filtros.</p>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/35">{items.length} fotos</span>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length) void uploadFiles(files);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-jungle-500 bg-jungle-50" : "border-ink/15 bg-white"}`}
      >
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-100 text-jungle-700">
            {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" /> : <Icon name="upload" className="h-5 w-5" />}
          </span>
          <span className="text-[12px] font-bold text-ink/65">{uploading ? "Subiendo fotos..." : "Arrastra fotos o haz clic para elegirlas"}</span>
          <span className="text-[10px] text-ink/35">Varias a la vez · JPG, PNG, WebP, GIF o AVIF · máx. 20 MB</span>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((image, index) => (
          <div key={image.id} className={`group overflow-hidden rounded-xl border bg-white ${image.active ? "border-ink/10" : "border-ink/10 opacity-60"}`}>
            <div className="relative aspect-square bg-cream-200">
              <SmartImage src={image.url} alt={image.alt || image.category} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
              <div className="absolute left-2 top-2 flex gap-1">
                <span className="badge bg-ink/60 text-white backdrop-blur">{image.category}</span>
                {!image.active && <span className="badge bg-red-600 text-white">Oculta</span>}
              </div>
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition group-hover:opacity-100">
                <button onClick={() => move(index, -1)} disabled={index === 0} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur disabled:opacity-20" aria-label="Mover antes">
                  <Icon name="chevron-left" className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur disabled:opacity-20" aria-label="Mover después">
                  <Icon name="chevron-right" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-2">
              <p className="truncate text-[10px] text-ink/45">{image.alt || "Sin descripción"}</p>
              <div className="mt-2 flex items-center justify-between gap-1">
                <button onClick={() => toggle(image)} className={`badge !px-2 !py-1 ${image.active ? "bg-lime-100 text-lime-800" : "bg-ink/5 text-ink/45"}`}>
                  {image.active ? "Visible" : "Oculta"}
                </button>
                <div className="flex gap-0.5">
                  <button onClick={() => openEditor(image)} className="flex h-7 w-7 items-center justify-center rounded text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700" aria-label="Editar">
                    <Icon name="edit" className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(image)} className="flex h-7 w-7 items-center justify-center rounded text-ink/30 transition hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/40">La galería está vacía.</div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl uppercase">Editar foto</h2>
              <button onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 text-ink/50" aria-label="Cerrar">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-lg bg-cream-200">
              <SmartImage src={editing.url} alt={editing.alt} fill sizes="400px" className="object-cover" />
            </div>
            <form onSubmit={saveEdit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="gal-alt" className="admin-label">Descripción / texto alternativo</label>
                <input id="gal-alt" maxLength={200} value={form.alt} onChange={(event) => setForm({ ...form, alt: event.target.value })} className="admin-input" placeholder="Atardecer en el cañón" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gal-category" className="admin-label">Categoría</label>
                  <input id="gal-category" maxLength={60} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="admin-input" />
                </div>
                <div>
                  <label htmlFor="gal-sort" className="admin-label">Orden</label>
                  <input id="gal-sort" type="number" min={0} max={999} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="admin-input" />
                </div>
              </div>
              <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-3 py-2.5 text-[11px] font-bold">
                Visible en la galería
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-jungle btn-sm flex-1">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
