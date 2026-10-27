"use client";

import { useEffect, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import type { GlampingImage } from "@/types";

export default function GlampingGallery({
  images,
  name,
}: {
  images: GlampingImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const list = images.length ? images : [];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") setActive((value) => (value + 1) % list.length);
      if (event.key === "ArrowLeft") setActive((value) => (value - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, list.length]);

  if (!list.length) return null;

  return (
    <div>
      <button
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-ink"
        aria-label="Abrir galería"
      >
        <SmartImage src={list[active].url} alt={list[active].alt || name} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-ink/60 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
          <Icon name="image" className="h-3.5 w-3.5" /> {active + 1} / {list.length}
        </span>
      </button>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {list.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${active === index ? "border-lime-400" : "border-transparent opacity-70 hover:opacity-100"}`}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <SmartImage src={image.url} alt={image.alt} fill sizes="15vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true">
          <button onClick={() => setLightbox(false)} className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white" aria-label="Cerrar">
            <Icon name="close" className="h-5 w-5" />
          </button>
          <button onClick={() => setActive((value) => (value - 1 + list.length) % list.length)} className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white sm:left-8" aria-label="Anterior">
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <div className="relative h-[80vh] w-full max-w-6xl">
            <SmartImage src={list[active].url} alt={list[active].alt || name} fill sizes="100vw" className="object-contain" />
          </div>
          <button onClick={() => setActive((value) => (value + 1) % list.length)} className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white sm:right-8" aria-label="Siguiente">
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
