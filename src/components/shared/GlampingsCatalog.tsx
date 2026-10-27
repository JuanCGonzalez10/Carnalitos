"use client";

import { useMemo, useState } from "react";
import GlampingCard from "@/components/shared/GlampingCard";
import Icon from "@/components/ui/Icon";
import type { Glamping } from "@/types";

export default function GlampingsCatalog({ glampings }: { glampings: Glamping[] }) {
  const [query, setQuery] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return glampings.filter((glamping) => {
      const matchesQuery =
        !query ||
        `${glamping.name} ${glamping.shortDescription} ${glamping.tagline} ${glamping.amenities.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesCapacity = !capacity || glamping.capacity >= capacity;
      return matchesQuery && matchesCapacity;
    });
  }, [glampings, query, capacity]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, comodidad o ambiente..."
            className="field pl-11"
            aria-label="Buscar glampings"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCapacity(null)} className={`badge border px-4 py-2 ${capacity === null ? "border-jungle-600 bg-jungle-600 text-white" : "border-ink/10 text-ink/50"}`}>
            Todos
          </button>
          {[2, 4, 6].map((value) => (
            <button
              key={value}
              onClick={() => setCapacity(value)}
              className={`badge border px-4 py-2 ${capacity === value ? "border-jungle-600 bg-jungle-600 text-white" : "border-ink/10 text-ink/50"}`}
            >
              {value}+ huéspedes
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink/35">{filtered.length} alojamientos disponibles</p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/15 p-14 text-center">
          <p className="font-display text-2xl uppercase">No encontramos coincidencias</p>
          <p className="mt-2 text-sm text-ink/50">Prueba con otra palabra o quita los filtros.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((glamping, index) => (
            <GlampingCard key={glamping.id} glamping={glamping} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
