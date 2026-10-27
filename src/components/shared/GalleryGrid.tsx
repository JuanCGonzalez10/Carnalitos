"use client";

import { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import type { GalleryImage } from "@/types";

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(images.map((image) => image.category)))],
    [images],
  );
  const [active, setActive] = useState("Todas");
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = active === "Todas" ? images : images.filter((image) => image.category === active);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight") setSelected((value) => (value === null ? null : (value + 1) % filtered.length));
      if (event.key === "ArrowLeft") setSelected((value) => (value === null ? null : (value - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, filtered.length]);

  return (
    <div>
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setActive(category);
              setSelected(null);
            }}
            className={`shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition ${
              active === category
                ? "border-jungle-700 bg-jungle-700 text-white"
                : "border-ink/10 bg-white text-ink/55 hover:border-jungle-500 hover:text-jungle-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {filtered.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelected(index)}
            className={`group relative overflow-hidden rounded-xl bg-cream-200 ${
              index % 7 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/3]"
            }`}
            aria-label={`Ampliar ${image.alt || image.category}`}
          >
            <SmartImage
              src={image.url}
              alt={image.alt || image.category}
              fill
              sizes={index % 7 === 0 ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, 25vw"}
              className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-ink/0 transition group-hover:bg-ink/25" />
            <span className="absolute bottom-3 left-3 rounded-full bg-ink/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              {image.category}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/45">
          Aún no hay fotos en esta categoría.
        </p>
      )}

      {selected !== null && filtered[selected] && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelected((value) => (value === null ? null : (value - 1 + filtered.length) % filtered.length))}
            className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-8"
            aria-label="Anterior"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <figure className="w-full max-w-6xl">
            <div className="relative h-[76vh] w-full">
              <SmartImage src={filtered[selected].url} alt={filtered[selected].alt || filtered[selected].category} fill sizes="100vw" className="object-contain" />
            </div>
            <figcaption className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-white/50">
              {filtered[selected].alt || filtered[selected].category} · {selected + 1} / {filtered.length}
            </figcaption>
          </figure>
          <button
            onClick={() => setSelected((value) => (value === null ? null : (value + 1) % filtered.length))}
            className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-8"
            aria-label="Siguiente"
          >
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
