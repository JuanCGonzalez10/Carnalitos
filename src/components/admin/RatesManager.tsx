"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { formatCOP, todayInColombia } from "@/lib/booking/pricing";
import { formatDate } from "@/lib/utils/format";
import type { GlampingRate } from "@/types";

export default function RatesManager({
  glampingId,
  initial,
  basePrice,
  weekendPricePerNight,
  holidayPricePerNight,
  onPricesSaved,
}: {
  glampingId: string;
  initial: GlampingRate[];
  basePrice: number;
  weekendPricePerNight: number | null;
  holidayPricePerNight: number | null;
  onPricesSaved?: (prices: {
    pricePerNight: number;
    weekendPricePerNight: number | null;
    holidayPricePerNight: number | null;
  }) => void;
}) {
  const router = useRouter();
  const today = todayInColombia();
  const [rates, setRates] = useState(initial);
  const [form, setForm] = useState({
    name: "",
    startDate: today,
    endDate: today,
    pricePerNight: "",
    minNights: "1",
  });
  const [prices, setPrices] = useState({
    base: String(basePrice),
    weekend: weekendPricePerNight == null ? "" : String(weekendPricePerNight),
    holiday: holidayPricePerNight == null ? "" : String(holidayPricePerNight),
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [priceMessage, setPriceMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setRates(initial);
  }, [initial]);

  useEffect(() => {
    setPrices({
      base: String(basePrice),
      weekend: weekendPricePerNight == null ? "" : String(weekendPricePerNight),
      holiday: holidayPricePerNight == null ? "" : String(holidayPricePerNight),
    });
  }, [basePrice, weekendPricePerNight, holidayPricePerNight]);

  function updatePrice(key: "base" | "weekend" | "holiday", value: string) {
    setPrices((previous) => ({ ...previous, [key]: value }));
    setPriceMessage(null);
  }

  async function savePrices(event: React.FormEvent) {
    event.preventDefault();
    setSavingPrices(true);
    setPriceMessage(null);
    try {
      const payload = {
        pricePerNight: Number(prices.base),
        weekendPricePerNight: prices.weekend === "" ? null : Number(prices.weekend),
        holidayPricePerNight: prices.holiday === "" ? null : Number(prices.holiday),
      };
      const response = await fetch(`/api/admin/glampings/${glampingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron guardar las tarifas.");
      onPricesSaved?.(payload);
      setPriceMessage({ type: "ok", text: "Tarifas generales guardadas." });
      router.refresh();
    } catch (error) {
      setPriceMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudieron guardar las tarifas.",
      });
    } finally {
      setSavingPrices(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (form.endDate < form.startDate) {
      setMessage({ type: "error", text: "La fecha final debe ser igual o posterior a la inicial." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          pricePerNight: Number(form.pricePerNight),
          minNights: Number(form.minNights),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear la tarifa.");
      setRates(data.rates as GlampingRate[]);
      setForm({ name: "", startDate: today, endDate: today, pricePerNight: "", minNights: "1" });
      setOpen(false);
      setMessage({ type: "ok", text: "Tarifa creada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear la tarifa." });
    } finally {
      setSaving(false);
    }
  }

  async function remove(rate: GlampingRate) {
    if (!window.confirm(`¿Eliminar la tarifa "${rate.name}"?`)) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/glampings/${glampingId}/rates?rateId=${rate.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la tarifa.");
      setRates(data.rates as GlampingRate[]);
      setMessage({ type: "ok", text: "Tarifa eliminada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar la tarifa." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl uppercase">Tarifas generales</h2>
          <p className="mt-1 text-sm text-ink/50">Edita aquí la tarifa base, la de sábados y domingos y la de festivos colombianos. Se aplican de inmediato en el sitio y en las cotizaciones.</p>
        </div>
        <span className="badge shrink-0 bg-jungle-50 text-jungle-700">COP por noche</span>
      </div>

      {priceMessage && (
        <p className={`rounded-lg px-4 py-3 text-sm ${priceMessage.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{priceMessage.text}</p>
      )}

      <form onSubmit={savePrices} className="rounded-xl border border-ink/10 bg-cream-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="price-base" className="admin-label">Base / noche (COP) *</label>
            <input
              id="price-base"
              type="number"
              required
              min={0}
              step={1000}
              value={prices.base}
              onChange={(event) => updatePrice("base", event.target.value)}
              className="admin-input"
              placeholder="180000"
            />
            <p className="mt-1 text-[10px] text-ink/40">Noches entre semana.</p>
          </div>
          <div>
            <label htmlFor="price-weekend" className="admin-label">Sábado y domingo / noche (COP)</label>
            <input
              id="price-weekend"
              type="number"
              min={0}
              step={1000}
              value={prices.weekend}
              onChange={(event) => updatePrice("weekend", event.target.value)}
              className="admin-input"
              placeholder="Vacío = usa la base"
            />
            <p className="mt-1 text-[10px] text-ink/40">{prices.weekend === "" ? "Ahora usa la tarifa base." : "Tarifa para sábados y domingos."}</p>
          </div>
          <div>
            <label htmlFor="price-holiday" className="admin-label">Festivo / noche (COP)</label>
            <input
              id="price-holiday"
              type="number"
              min={0}
              step={1000}
              value={prices.holiday}
              onChange={(event) => updatePrice("holiday", event.target.value)}
              className="admin-input"
              placeholder="Vacío = usa la base"
            />
            <p className="mt-1 text-[10px] text-ink/40">{prices.holiday === "" ? "Ahora usa la tarifa base." : "Festivos nacionales de Colombia."}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-ink/[0.07] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-ink/45">
            Precedencia por noche: temporada especial &gt; festivo &gt; fin de semana &gt; base. Deja un campo vacío para usar la tarifa base.
          </p>
          <button type="submit" disabled={savingPrices} className="btn-jungle btn-sm shrink-0">
            {savingPrices ? "Guardando..." : "Guardar tarifas"}
          </button>
        </div>
      </form>

      <div className="flex flex-col justify-between gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl uppercase">Tarifas por temporada</h2>
          <p className="mt-1 text-sm text-ink/50">Para fechas específicas (puentes, Semana Santa, temporada alta). Tienen prioridad sobre las tarifas generales.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-outline btn-sm shrink-0">
          <Icon name={open ? "close" : "plus"} className="h-3.5 w-3.5" /> {open ? "Cerrar" : "Nueva tarifa"}
        </button>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      {open && (
        <form onSubmit={add} className="rounded-xl border border-ink/10 bg-cream-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label htmlFor="rate-name" className="admin-label">Nombre</label>
              <input id="rate-name" required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" placeholder="Temporada alta" />
            </div>
            <div>
              <label htmlFor="rate-start" className="admin-label">Desde</label>
              <input id="rate-start" type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="rate-end" className="admin-label">Hasta</label>
              <input id="rate-end" type="date" required min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="admin-input" />
            </div>
            <div>
              <label htmlFor="rate-price" className="admin-label">Precio / noche (COP)</label>
              <input id="rate-price" type="number" required min={0} step={1000} value={form.pricePerNight} onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })} className="admin-input" placeholder="450000" />
            </div>
            <div>
              <label htmlFor="rate-min" className="admin-label">Mínimo noches</label>
              <input id="rate-min" type="number" required min={1} max={30} value={form.minNights} onChange={(event) => setForm({ ...form, minNights: event.target.value })} className="admin-input" />
            </div>
            <div className="flex items-end lg:col-span-4">
              <button type="submit" disabled={saving} className="btn-jungle btn-sm">
                {saving ? "Guardando..." : "Guardar tarifa"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="admin-table min-w-[600px]">
          <thead>
            <tr>
              <th>Temporada</th>
              <th>Rango</th>
              <th>Mínimo</th>
              <th>Precio / noche</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="font-semibold">{rate.name}</td>
                <td className="text-[12px] text-ink/55">{formatDate(rate.startDate)} → {formatDate(rate.endDate)}</td>
                <td className="text-[12px] text-ink/55">{rate.minNights} noches</td>
                <td className="font-semibold">{formatCOP(rate.pricePerNight)}</td>
                <td className="text-right">
                  <button type="button" onClick={() => remove(rate)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/30 transition hover:bg-red-50 hover:text-red-600" aria-label="Eliminar tarifa">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rates.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-ink/35">No hay tarifas especiales. Se aplica la tarifa base del alojamiento.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
