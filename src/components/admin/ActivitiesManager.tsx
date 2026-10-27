"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "@/components/admin/ImageField";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { Activity } from "@/types";

const EMPTY = {
  name: "",
  slug: "",
  category: "Aventura",
  shortDescription: "",
  description: "",
  price: "",
  weekendPrice: "",
  holidayPrice: "",
  priceUnit: "persona",
  duration: "",
  difficulty: "Media",
  minAge: "8",
  maxPeople: "",
  includesText: "",
  requirements: "",
  image: "",
  active: true,
  featured: false,
  sortOrder: "0",
};

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ActivitiesManager({ initial }: { initial: Activity[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Activity | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term));
  }, [items, search]);

  function openEditor(activity: Activity | "new") {
    setEditing(activity);
    setMessage(null);
    if (activity === "new") {
      setForm(EMPTY);
    } else {
      setForm({
        name: activity.name,
        slug: activity.slug,
        category: activity.category,
        shortDescription: activity.shortDescription,
        description: activity.description,
        price: String(activity.price),
        weekendPrice: activity.weekendPrice != null ? String(activity.weekendPrice) : "",
        holidayPrice: activity.holidayPrice != null ? String(activity.holidayPrice) : "",
        priceUnit: activity.priceUnit,
        duration: activity.duration,
        difficulty: activity.difficulty,
        minAge: String(activity.minAge),
        maxPeople: activity.maxPeople ? String(activity.maxPeople) : "",
        includesText: activity.includes.join("\n"),
        requirements: activity.requirements,
        image: activity.image,
        active: activity.active,
        featured: activity.featured,
        sortOrder: String(activity.sortOrder),
      });
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug.trim() || undefined,
        category: form.category,
        shortDescription: form.shortDescription,
        description: form.description,
        price: Number(form.price),
        weekendPrice: form.weekendPrice === "" ? null : Number(form.weekendPrice),
        holidayPrice: form.holidayPrice === "" ? null : Number(form.holidayPrice),
        priceUnit: form.priceUnit,
        duration: form.duration,
        difficulty: form.difficulty,
        minAge: Number(form.minAge),
        maxPeople: form.maxPeople === "" ? null : Number(form.maxPeople),
        includes: splitLines(form.includesText),
        requirements: form.requirements,
        image: form.image,
        active: form.active,
        featured: form.featured,
        sortOrder: Number(form.sortOrder),
      };
      const isNew = editing === "new";
      const response = await fetch(isNew ? "/api/admin/activities" : `/api/admin/activities/${(editing as Activity).id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la actividad.");
      const saved = data.activity as Activity;
      setItems((previous) => (isNew ? [saved, ...previous] : previous.map((item) => (item.id === saved.id ? saved : item))));
      setEditing(null);
      setMessage({ type: "ok", text: isNew ? "Actividad creada." : "Actividad actualizada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar la actividad." });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(activity: Activity) {
    try {
      const response = await fetch(`/api/admin/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !activity.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setItems((previous) => previous.map((item) => (item.id === activity.id ? { ...item, active: !item.active } : item)));
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar." });
    }
  }

  async function remove(activity: Activity) {
    if (!window.confirm(`¿Eliminar "${activity.name}"? Si tiene reservas asociadas, solo se desactivará.`)) return;
    try {
      const response = await fetch(`/api/admin/activities/${activity.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar.");
      setMessage({ type: "ok", text: data.message ?? "Actividad eliminada." });
      if (data.result === "deleted") {
        setItems((previous) => previous.filter((item) => item.id !== activity.id));
      } else {
        setItems((previous) => previous.map((item) => (item.id === activity.id ? { ...item, active: false } : item)));
      }
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar actividad" className="admin-input pl-9" />
        </div>
        <button onClick={() => openEditor("new")} className="btn-jungle btn-sm shrink-0">
          <Icon name="plus" className="h-3.5 w-3.5" /> Nueva actividad
        </button>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((activity) => (
          <article key={activity.id} className={`overflow-hidden rounded-xl border bg-white transition ${activity.active ? "border-ink/10" : "border-ink/10 opacity-60"}`}>
            <div className="relative aspect-[16/9] bg-cream-200">
              <SmartImage src={activity.image || "/images/act-senderismo.jpg"} alt={activity.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className="badge bg-white/95 text-jungle-700">{activity.category}</span>
                {!activity.active && <span className="badge bg-ink/70 text-white">Oculta</span>}
                {activity.featured && <span className="badge bg-lime-400 text-ink">Destacada</span>}
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-display text-xl uppercase leading-none">{activity.name}</p>
                <p className="mt-1 text-[10px] text-white/60">{activity.duration} · {activity.difficulty}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Precio por {activity.priceUnit}</p>
                  <p className="font-display text-lg">{formatCOP(activity.price)}</p>
                  {(activity.weekendPrice != null || activity.holidayPrice != null) && (
                    <p className="mt-0.5 text-[9px] text-ink/40">
                      {activity.weekendPrice != null && <>Fin de semana {formatCOP(activity.weekendPrice)}</>}
                      {activity.weekendPrice != null && activity.holidayPrice != null && " · "}
                      {activity.holidayPrice != null && <>Festivo {formatCOP(activity.holidayPrice)}</>}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-ink/35">máx. {activity.maxPeople ?? "—"} pers.</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-1 border-t border-ink/[0.06] pt-3">
                <button onClick={() => toggle(activity)} className={`badge ${activity.active ? "bg-lime-100 text-lime-800" : "bg-ink/5 text-ink/50"}`}>
                  {activity.active ? "Activa" : "Oculta"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEditor(activity)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700" aria-label="Editar">
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(activity)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/30 transition hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/40">
            No hay actividades que coincidan.
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-ink/50">
          <button className="absolute inset-0" onClick={() => setEditing(null)} aria-label="Cerrar editor" />
          <div className="relative flex h-full w-full max-w-2xl flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Actividad</p>
                <h2 className="font-display text-xl uppercase leading-none">{editing === "new" ? "Nueva actividad" : "Editar actividad"}</h2>
              </div>
              <button onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition hover:bg-cream-100" aria-label="Cerrar">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save} className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Datos generales</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="a-name" className="admin-label">Nombre *</label>
                    <input id="a-name" required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="a-category" className="admin-label">Categoría</label>
                    <input id="a-category" maxLength={60} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="admin-input" placeholder="Aventura, Naturaleza..." />
                  </div>
                  <div>
                    <label htmlFor="a-slug" className="admin-label">Slug</label>
                    <input id="a-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="admin-input font-mono text-[12px]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="a-short" className="admin-label">Descripción corta</label>
                    <textarea id="a-short" maxLength={300} rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} className="admin-input resize-y" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="a-description" className="admin-label">Descripción completa</label>
                    <textarea id="a-description" maxLength={5000} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="admin-textarea" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Precio y logística</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="a-price" className="admin-label">Precio base (COP) *</label>
                    <input id="a-price" type="number" required min={0} step={1000} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="a-weekend-price" className="admin-label">Precio fin de semana (COP)</label>
                    <input id="a-weekend-price" type="number" min={0} step={1000} value={form.weekendPrice} onChange={(event) => setForm({ ...form, weekendPrice: event.target.value })} className="admin-input" placeholder="Si vacío, usa la base" />
                    <p className="mt-1 text-[10px] text-ink/35">Sábado y domingo.</p>
                  </div>
                  <div>
                    <label htmlFor="a-holiday-price" className="admin-label">Precio festivo (COP)</label>
                    <input id="a-holiday-price" type="number" min={0} step={1000} value={form.holidayPrice} onChange={(event) => setForm({ ...form, holidayPrice: event.target.value })} className="admin-input" placeholder="Si vacío, usa la base" />
                    <p className="mt-1 text-[10px] text-ink/35">Festivos colombianos.</p>
                  </div>
                  <div>
                    <label htmlFor="a-unit" className="admin-label">Unidad</label>
                    <input id="a-unit" maxLength={30} value={form.priceUnit} onChange={(event) => setForm({ ...form, priceUnit: event.target.value })} className="admin-input" placeholder="persona" />
                  </div>
                  <div>
                    <label htmlFor="a-duration" className="admin-label">Duración</label>
                    <input id="a-duration" maxLength={60} value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className="admin-input" placeholder="3 horas" />
                  </div>
                  <div>
                    <label htmlFor="a-difficulty" className="admin-label">Dificultad</label>
                    <select id="a-difficulty" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="admin-input">
                      {["Baja", "Media", "Alta", "Extrema"].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="a-minage" className="admin-label">Edad mínima</label>
                    <input id="a-minage" type="number" min={0} max={100} value={form.minAge} onChange={(event) => setForm({ ...form, minAge: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="a-maxpeople" className="admin-label">Máx. personas</label>
                    <input id="a-maxpeople" type="number" min={1} max={100} value={form.maxPeople} onChange={(event) => setForm({ ...form, maxPeople: event.target.value })} className="admin-input" placeholder="Sin límite" />
                  </div>
                </div>
                <p className="mt-3 rounded-lg bg-jungle-50 px-3 py-2 text-[11px] leading-5 text-jungle-800">
                  El precio de la actividad se define según la fecha de llegada de la reserva: si es festivo se usa el precio de festivo; si es sábado o domingo, el de fin de semana; si no, el base. Deja un campo vacío para usar el precio base.
                </p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Detalles</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="a-includes" className="admin-label">Qué incluye (una por línea)</label>
                    <textarea id="a-includes" rows={4} value={form.includesText} onChange={(event) => setForm({ ...form, includesText: event.target.value })} className="admin-textarea" />
                  </div>
                  <div>
                    <label htmlFor="a-requirements" className="admin-label">Requisitos / recomendaciones</label>
                    <textarea id="a-requirements" maxLength={2000} rows={3} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} className="admin-textarea" />
                  </div>
                  <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Foto de la actividad" />
                </div>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Publicación</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-3 py-2.5 text-[11px] font-bold">
                    Activa
                    <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
                  </label>
                  <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-3 py-2.5 text-[11px] font-bold">
                    Destacada
                    <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
                  </label>
                  <div>
                    <label htmlFor="a-sort" className="admin-label">Orden</label>
                    <input id="a-sort" type="number" min={0} max={999} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="admin-input" />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-2 border-t border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur">
                <button type="button" onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-jungle btn-sm flex-1">{saving ? "Guardando..." : "Guardar actividad"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
