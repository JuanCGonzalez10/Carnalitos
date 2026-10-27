"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { Glamping } from "@/types";

export default function GlampingsAdminList({ initial }: { initial: Glamping[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "active" && !item.active) return false;
        if (filter === "inactive" && item.active) return false;
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return item.name.toLowerCase().includes(term) || item.slug.toLowerCase().includes(term);
      }),
    [items, filter, search],
  );

  async function toggleActive(item: Glamping) {
    setBusyId(item.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, active: !entry.active } : entry)));
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar." });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: Glamping) {
    if (!window.confirm(`¿Eliminar "${item.name}"? Si tiene reservas asociadas, solo se desactivará.`)) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar.");
      setMessage({ type: "ok", text: data.message ?? "Glamping eliminado." });
      if (data.result === "deleted") {
        setItems((previous) => previous.filter((entry) => entry.id !== item.id));
      } else {
        setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, active: false } : entry)));
      }
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o slug"
              className="admin-input pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-lg bg-cream-100 p-1">
            {(["all", "active", "inactive"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                  filter === value ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
                }`}
              >
                {value === "all" ? "Todos" : value === "active" ? "Publicados" : "Ocultos"}
              </button>
            ))}
          </div>
        </div>
        <Link href="/admin/glampings/nuevo" className="btn-jungle btn-sm shrink-0">
          <Icon name="plus" className="h-3.5 w-3.5" /> Nuevo glamping
        </Link>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <div className="admin-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Alojamiento</th>
                <th>Tarifa</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th>Destacado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={busyId === item.id ? "opacity-50" : ""}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                        <SmartImage src={item.mainImage || "/images/glamping-bosque.jpg"} alt={item.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold">{item.name}</p>
                        <p className="truncate text-[10px] text-ink/35">/glampings/{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-[12px] font-semibold">{formatCOP(item.pricePerNight)}<span className="block text-[9px] font-normal text-ink/35">por noche</span></td>
                  <td className="text-[12px] text-ink/60">{item.capacity} huéspedes</td>
                  <td>
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={busyId === item.id}
                      className={`badge transition ${item.active ? "bg-lime-100 text-lime-800 hover:bg-lime-200" : "bg-ink/5 text-ink/50 hover:bg-ink/10"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-jungle-600" : "bg-ink/30"}`} />
                      {item.active ? "Publicado" : "Oculto"}
                    </button>
                  </td>
                  <td>
                    {item.featured ? (
                      <span className="badge bg-sun-100 text-yellow-800">Destacado</span>
                    ) : (
                      <span className="text-[11px] text-ink/30">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/glampings/${item.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700" title="Ver publicado">
                        <Icon name="eye" className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/glampings/${item.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700" title="Editar">
                        <Icon name="edit" className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(item)} disabled={busyId === item.id} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/30 transition hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm text-ink/40">No hay glampings que coincidan con el filtro.</p>
                    <Link href="/admin/glampings/nuevo" className="link-arrow mt-3">Crear el primero</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-ink/35">
        {filtered.length} de {items.length} alojamientos. Los alojamientos ocultos no aparecen en el sitio público ni se pueden reservar.
      </p>
    </div>
  );
}
