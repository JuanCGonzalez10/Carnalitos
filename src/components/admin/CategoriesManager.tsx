"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import ImageField from "@/components/admin/ImageField";
import type { Category } from "@/types";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  sortOrder: string;
  active: boolean;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  description: "",
  icon: "paw",
  image: "",
  sortOrder: "0",
  active: true,
};

const ICONS = [
  { value: "paw", label: "Huella" },
  { value: "bone", label: "Hueso" },
  { value: "heart", label: "Corazón" },
  { value: "star", label: "Estrella" },
  { value: "utensils", label: "Comida" },
  { value: "leaf", label: "Natural" },
  { value: "bag", label: "Bolsa" },
];

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openCreate() {
    setDraft(EMPTY);
    setOpen(true);
    setMessage(null);
  }

  function openEdit(category: Category) {
    setDraft({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      image: category.image,
      sortOrder: String(category.sortOrder),
      active: category.active,
    });
    setOpen(true);
    setMessage(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setMessage(null);
    try {
      const isEdit = Boolean(draft.id);
      const response = await fetch(isEdit ? `/api/admin/categories/${draft.id}` : "/api/admin/categories", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          slug: draft.slug || undefined,
          description: draft.description,
          icon: draft.icon,
          image: draft.image,
          sortOrder: draft.sortOrder,
          active: draft.active,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la categoría.");
      const saved = data.category as Category;
      setCategories((previous) =>
        isEdit ? previous.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)) : [...previous, saved],
      );
      setOpen(false);
      setMessage({ type: "ok", text: isEdit ? "Categoría actualizada." : "Categoría creada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar la categoría." });
    } finally {
      setBusy(null);
    }
  }

  async function toggle(category: Category) {
    setBusy(category.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          image: category.image,
          sortOrder: category.sortOrder,
          active: !category.active,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la categoría.");
      setCategories((previous) =>
        previous.map((item) => (item.id === category.id ? { ...item, active: !category.active } : item)),
      );
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar la categoría." });
    } finally {
      setBusy(null);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`¿Eliminar "${category.name}"? Si tiene productos, quedará desactivada.`)) return;
    setBusy(category.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la categoría.");
      if (data.result === "deleted") {
        setCategories((previous) => previous.filter((item) => item.id !== category.id));
      } else {
        setCategories((previous) =>
          previous.map((item) => (item.id === category.id ? { ...item, active: false } : item)),
        );
      }
      setMessage({ type: "ok", text: data.message || "Categoría actualizada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar la categoría." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Categorías</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Organiza la tienda por tipo de producto o mascota. El orden define cómo aparecen los filtros públicos.
          </p>
        </div>
        <button onClick={openCreate} className="btn-jungle btn-sm">
          <Icon name="plus" className="h-3.5 w-3.5" /> Nueva categoría
        </button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className={`admin-card ${busy === category.id ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-jungle-700">
                <Icon name={ICONS.some((icon) => icon.value === category.icon) ? (category.icon as "paw") : "paw"} className="h-5 w-5" />
              </span>
              <button
                onClick={() => toggle(category)}
                className={`badge ${category.active ? "bg-jungle-50 text-jungle-700" : "bg-ink/5 text-ink/45"}`}
                title="Cambiar visibilidad"
              >
                {category.active ? "Activa" : "Inactiva"}
              </button>
            </div>
            <h2 className="mt-4 text-2xl uppercase leading-none">{category.name}</h2>
            <p className="mt-1 font-mono text-[10px] text-ink/35">/{category.slug}</p>
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink/50">{category.description || "Sin descripción."}</p>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/35">
                {category.productCount ?? 0} producto{category.productCount === 1 ? "" : "s"}
              </span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(category)} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-ink/50 transition hover:border-jungle-500 hover:text-jungle-700" title="Editar categoría">
                  <Icon name="edit" className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(category)} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-ink/40 transition hover:border-red-300 hover:text-red-600" title="Eliminar categoría">
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {categories.length === 0 && (
          <div className="admin-card col-span-full py-14 text-center">
            <Icon name="grid" className="mx-auto h-8 w-8 text-ink/20" />
            <p className="mt-2 text-sm text-ink/40">Aún no hay categorías. Crea la primera para organizar el catálogo.</p>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-ink/55" onClick={() => setOpen(false)} aria-label="Cerrar editor" />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">
                  {draft.id ? "Editar categoría" : "Nueva categoría"}
                </p>
                <h2 className="mt-1 text-2xl uppercase leading-none">{draft.name || "Sin nombre"}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:text-ink" aria-label="Cerrar">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-5">
              <div>
                <label className="admin-label">Nombre *</label>
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label">Slug (opcional)</label>
                <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="se-genera-del-nombre" className="admin-input font-mono text-[11px]" />
              </div>
              <div>
                <label className="admin-label">Descripción</label>
                <textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="admin-textarea" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Icono</label>
                  <select value={draft.icon} onChange={(event) => setDraft({ ...draft, icon: event.target.value })} className="admin-input">
                    {ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Orden</label>
                  <input type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} className="admin-input" />
                </div>
              </div>
              <ImageField value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} label="Imagen de la categoría (opcional)" />
              <label className="flex items-center gap-2 text-[12px] font-semibold text-ink/65">
                <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="h-4 w-4 accent-jungle-700" />
                Categoría activa
              </label>

              {message?.type === "error" && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message.text}</p>}

              <div className="flex gap-2 border-t border-ink/10 pt-4">
                <button type="submit" disabled={busy === "save"} className="btn-jungle flex-1">
                  <Icon name="check" className="h-4 w-4" /> {busy === "save" ? "Guardando..." : draft.id ? "Guardar cambios" : "Crear categoría"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
