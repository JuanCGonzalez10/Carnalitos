"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { addDays, todayInColombia } from "@/lib/booking/pricing";

export default function BookingSearchBar({
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 2,
  maxGuests = 12,
  variant = "hero",
  glampingSlug,
}: {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  maxGuests?: number;
  variant?: "hero" | "inline";
  glampingSlug?: string;
}) {
  const router = useRouter();
  const today = useMemo(() => todayInColombia(), []);
  const [checkIn, setCheckIn] = useState(initialCheckIn || addDays(today, 7));
  const [checkOut, setCheckOut] = useState(initialCheckOut || addDays(today, 9));
  const [guests, setGuests] = useState(initialGuests);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    if (glampingSlug) params.set("glamping", glampingSlug);
    router.push(`/reservar?${params.toString()}`);
  };

  if (variant === "inline") {
    return (
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="inline-checkin">Llegada</label>
          <input
            id="inline-checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
            }}
            className="field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="inline-checkout">Salida</label>
          <input
            id="inline-checkout"
            type="date"
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="inline-guests">Huéspedes</label>
          <select id="inline-guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="field">
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-lime w-full">Consultar <Icon name="arrow" className="h-4 w-4" /></button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-2xl border border-white/15 bg-ink/55 p-2.5 shadow-2xl backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]"
    >
      <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5">
        <Icon name="calendar" className="h-4 w-4 shrink-0 text-lime-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45">Llegada</span>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
            }}
            className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-bold text-white focus:outline-none [color-scheme:dark]"
            aria-label="Fecha de llegada"
          />
        </span>
      </label>
      <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5 lg:border-l lg:border-white/10">
        <Icon name="calendar" className="h-4 w-4 shrink-0 text-lime-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45">Salida</span>
          <input
            type="date"
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-bold text-white focus:outline-none [color-scheme:dark]"
            aria-label="Fecha de salida"
          />
        </span>
      </label>
      <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5 lg:border-l lg:border-white/10">
        <Icon name="users" className="h-4 w-4 shrink-0 text-lime-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45">Huéspedes</span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-bold text-white focus:outline-none"
            aria-label="Número de huéspedes"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="text-ink">{n} {n === 1 ? "huésped" : "huéspedes"}</option>
            ))}
          </select>
        </span>
      </label>
      <button type="submit" className="btn-lime h-full min-h-[52px] rounded-xl">
        Buscar disponibilidad <Icon name="arrow" className="h-4 w-4" />
      </button>
    </form>
  );
}
