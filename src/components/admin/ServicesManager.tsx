"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "@/components/admin/ImageField";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { Service } from "@/types";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  priceUnit: "servicio",
  image: "",
  active: true,
  sortOrder: "0",
};

export default function ServicesManager({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function openEditor(service: Service | "new") {
    setEditing(service);
    setMessage(null);
    setForm(
      service === "new"
        ? EMPTY
        : {
            name: service.name,
            description: service.description,
            price: String(service.price),
            priceUnit: service.priceUnit,
            image: service.image,
            active: service.active,
            sortOrder: String(service.sortOrder),
          },
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const isNew = editing === "new";
      const response = await fetch(isNew ? "/api/admin/services" : `/api/admin/services/${(editing as Service).id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          priceUnit: form.priceUnit,
          image: form.image,
          active: form.active,
          sortOrder: Number(form.sortOrder),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el servicio.");
      const saved = data.service as Service;
      setItems((previous) => (isNew ? [saved, ...previous] : previous.map((item) => (item.id === saved.id ? saved : item))));
      setEditing(null);
      setMessage({ type: "ok", text: isNew ? "Servicio creado." : "Servicio actualizado." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el servicio." });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(service: Service) {
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !service.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setItems((previous) => previous.map((item) => (item.id === service.id ? { ...item, active: !item.active } : item)));
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar." });
    }
  }

  async function remove(service: Service) {
    if (!window.confirm(`¿Eliminar "${service.name}"? Si tiene reservas asociadas, solo se desactivará.`)) return;
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar.");
      setMessage({ type: "ok", text: data.message ?? "Servicio eliminado." });
      if (data.result === "deleted") {
        setItems((previous) => previous.filter((item) => item.id !== service.id));
      } else {
        setItems((previous) => previous.map((item) => (item.id === service.id ? { ...item, active: false } : item)));
      }
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => openEditor("new")} className="btn-jungle btn-sm">
          <Icon name="plus" className="h-3.5 w-3.5" /> Nuevo servicio
        </button>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((service) => (
          <article key={service.id} className={`flex gap-4 rounded-xl border border-ink/10 bg-white p-4 ${service.active ? "" : "opacity-60"}`}>
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-cream-200">
              <SmartImage src={service.image || "/images/serv-desayuno.jpg"} alt={service.name} fill sizes="96px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base uppercase leading-tight">{service.name}</h3>
                <button onClick={() => toggle(service)} className={`badge shrink-0 ${service.active ? "bg-lime-100 text-lime-800" : "bg-ink/5 text-ink/50"}`}>
                  {service.active ? "Activo" : "Oculto"}
                </button>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink/45">{service.description}</p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <p className="text-sm font-bold text-jungle-700">{formatCOP(service.price)} <span className="text-[9px] font-normal text-ink/35">/ {service.priceUnit}</span></p>
                <div className="flex gap-1">
                  <button onClick={() => openEditor(service)} className="flex h-7 w-7 items-center justify-center rounded text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700" aria-label="Editar">
                    <Icon name="edit" className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(service)} className="flex h-7 w-7 items-center justify-center rounded text-ink/30 transition hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/40">No hay servicios adicionales.</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-ink/50">
          <button className="absolute inset-0" onClick={() => setEditing(null)} aria-label="Cerrar editor" />
          <div className="relative flex h-full w-full max-w-lg flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Servicio adicional</p>
                <h2 className="font-display text-xl uppercase leading-none">{editing === "new" ? "Nuevo servicio" : "Editar servicio"}</h2>
              </div>
              <button onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50" aria-label="Cerrar">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label htmlFor="s-name" className="admin-label">Nombre *</label>
                <input id="s-name" required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="s-description" className="admin-label">Descripción</label>
                <textarea id="s-description" maxLength={2000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="admin-textarea" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-price" className="admin-label">Precio (COP) *</label>
                  <input id="s-price" type="number" required min={0} step={1000} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="admin-input" />
                </div>
                <div>
                  <label htmlFor="s-unit" className="admin-label">Unidad</label>
                  <input id="s-unit" maxLength={30} value={form.priceUnit} onChange={(event) => setForm({ ...form, priceUnit: event.target.value })} className="admin-input" placeholder="servicio, persona, noche..." />
                </div>
              </div>
              <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Imagen del servicio" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-[11px] font-bold">
                  Activo
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
                </label>
                <div>
                  <label htmlFor="s-sort" className="admin-label">Orden</label>
                  <input id="s-sort" type="number" min={0} max={999} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="admin-input" />
                </div>
              </div>
              <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-2 border-t border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur">
                <button type="button" onClick={() => setEditing(null)} className="btn-outline btn-sm flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-jungle btn-sm flex-1">{saving ? "Guardando..." : "Guardar servicio"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
