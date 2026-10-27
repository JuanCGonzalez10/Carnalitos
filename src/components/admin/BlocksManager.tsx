"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { todayInColombia } from "@/lib/booking/pricing";
import { formatDate } from "@/lib/utils/format";
import type { BlockedDate } from "@/types";

export default function BlocksManager({
  glampingId,
  initial,
}: {
  glampingId: string;
  initial: BlockedDate[];
}) {
  const router = useRouter();
  const today = todayInColombia();
  const [blocks, setBlocks] = useState(initial);
  const [form, setForm] = useState({ startDate: today, endDate: today, reason: "" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setBlocks(initial);
  }, [initial]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (form.endDate < form.startDate) {
      setMessage({ type: "error", text: "La fecha final debe ser igual o posterior a la inicial." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo bloquear la fecha.");
      setBlocks(data.blocks as BlockedDate[]);
      setForm({ startDate: today, endDate: today, reason: "" });
      setOpen(false);
      setMessage({ type: "ok", text: "Fechas bloqueadas." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo bloquear la fecha." });
    } finally {
      setSaving(false);
    }
  }

  async function remove(block: BlockedDate) {
    if (!window.confirm("¿Liberar estas fechas?")) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/blocks?blockId=${block.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo liberar la fecha.");
      setBlocks(data.blocks as BlockedDate[]);
      setMessage({ type: "ok", text: "Fechas liberadas." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo liberar la fecha." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl uppercase">Fechas bloqueadas</h2>
          <p className="mt-1 text-sm text-ink/50">Bloquea mantenimiento, cierres o fechas no disponibles. La fecha final se incluye en el bloqueo.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-outline btn-sm shrink-0">
          <Icon name={open ? "close" : "plus"} className="h-3.5 w-3.5" /> {open ? "Cerrar" : "Bloquear fechas"}
        </button>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      {open && (
        <form onSubmit={add} className="rounded-xl border border-ink/10 bg-cream-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="block-start" className="admin-label">Desde</label>
              <input id="block-start" type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="block-end" className="admin-label">Hasta (incluido)</label>
              <input id="block-end" type="date" required min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="admin-input" />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="block-reason" className="admin-label">Motivo</label>
              <input id="block-reason" maxLength={200} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="admin-input" placeholder="Mantenimiento, cierre privado..." />
            </div>
            <div className="lg:col-span-4">
              <button type="submit" disabled={saving} className="btn-jungle btn-sm">{saving ? "Guardando..." : "Guardar bloqueo"}</button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="admin-table min-w-[520px]">
          <thead>
            <tr>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Motivo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.id}>
                <td className="font-semibold">{formatDate(block.startDate)}</td>
                <td className="text-[12px] text-ink/55">{formatDate(block.endDate)}</td>
                <td className="text-[12px] text-ink/55">{block.reason || "Sin motivo"}</td>
                <td className="text-right">
                  <button type="button" onClick={() => remove(block)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/30 transition hover:bg-red-50 hover:text-red-600" aria-label="Liberar fechas">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {blocks.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-ink/35">No hay fechas bloqueadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
