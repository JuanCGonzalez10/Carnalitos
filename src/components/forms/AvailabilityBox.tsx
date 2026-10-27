"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { addDays, formatCOP, todayInColombia } from "@/lib/booking/pricing";
import type { AvailabilityItem } from "@/types";

export default function AvailabilityBox({
  glampingId,
  glampingSlug,
  basePrice,
  weekendPrice,
  holidayPrice,
  capacity,
  maxGuests,
}: {
  glampingId: string;
  glampingSlug: string;
  basePrice: number;
  weekendPrice?: number | null;
  holidayPrice?: number | null;
  capacity: number;
  maxGuests: number;
}) {
  const today = todayInColombia();
  const [checkIn, setCheckIn] = useState(addDays(today, 7));
  const [checkOut, setCheckOut] = useState(addDays(today, 9));
  const [guests, setGuests] = useState(Math.min(2, capacity));
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<AvailabilityItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (data.error) {
          setError(data.error);
          setItem(null);
          return;
        }
        setError(null);
        setItem((data.items as AvailabilityItem[]).find((entry) => entry.glamping.id === glampingId) ?? null);
      })
      .catch(() => {
        if (!active) return;
        setError("No se pudo consultar la disponibilidad.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [checkIn, checkOut, guests, glampingId]);

  const quote = item?.quote;
  const available = item?.available;
  const query = new URLSearchParams({ glamping: glampingSlug, checkIn, checkOut, guests: String(guests) }).toString();

  function updateCheckIn(value: string) {
    setLoading(true);
    setError(null);
    setCheckIn(value);
    if (value >= checkOut) setCheckOut(addDays(value, 1));
  }

  function updateCheckOut(value: string) {
    setLoading(true);
    setError(null);
    setCheckOut(value);
  }

  function updateGuests(value: number) {
    setLoading(true);
    setError(null);
    setGuests(value);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-6">
      <div className="flex items-end justify-between border-b border-ink/10 pb-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Desde / noche</p>
          <p className="mt-1 font-display text-3xl text-ink">{formatCOP(quote?.nightlyRate ?? basePrice)}</p>
        </div>
        <span className="badge bg-cream-100 text-ink/55">{capacity} huéspedes</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink/45">
        <span>Base <strong className="font-bold text-ink/65">{formatCOP(basePrice)}</strong></span>
        <span>Fin de semana <strong className="font-bold text-ink/65">{formatCOP(weekendPrice ?? basePrice)}</strong></span>
        <span>Festivo <strong className="font-bold text-ink/65">{formatCOP(holidayPrice ?? basePrice)}</strong></span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="detail-checkin" className="field-label">Llegada</label>
          <input
            id="detail-checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(event) => {
              updateCheckIn(event.target.value);
            }}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="detail-checkout" className="field-label">Salida</label>
          <input
            id="detail-checkout"
            type="date"
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(event) => updateCheckOut(event.target.value)}
            className="field"
          />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="detail-guests" className="field-label">Huéspedes</label>
        <select id="detail-guests" value={guests} onChange={(event) => updateGuests(Number(event.target.value))} className="field">
          {Array.from({ length: Math.min(capacity, maxGuests) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 min-h-[54px] rounded-xl bg-cream-50 p-3.5 text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-ink/45">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" /> Consultando...
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : quote ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-ink/55">
              <span>{quote.nights} {quote.nights === 1 ? "noche" : "noches"} · {quote.rateName}</span>
              <span>{formatCOP(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-1.5 font-bold text-ink">
              <span>Total estadía</span>
              <span>{formatCOP(quote.total)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-jungle-700">
              <span>Anticipo ({Math.round((quote.depositRequired / Math.max(quote.total, 1)) * 100)}%)</span>
              <span>{formatCOP(quote.depositRequired)}</span>
            </div>
          </div>
        ) : (
          <p className="text-ink/45">Selecciona fechas para ver el precio.</p>
        )}
      </div>

      {item && !available ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-700">
          {item.reason ?? "No disponible en esas fechas."}
        </div>
      ) : null}

      <Link
        href={`/reservar?${query}`}
        aria-disabled={item ? !available : false}
        className={`mt-4 w-full ${item && !available ? "pointer-events-none btn bg-ink/10 text-ink/35" : "btn-lime"}`}
      >
        {item && !available ? "Fechas no disponibles" : "Reservar estas fechas"} <Icon name="arrow" className="h-4 w-4" />
      </Link>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-ink/35">
        <Icon name="shield" className="h-3 w-3" /> Disponibilidad validada en tiempo real
      </p>
    </div>
  );
}
