"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import { formatDate } from "@/lib/utils/format";
import type { AvailabilityItem, Glamping, GlampingImage } from "@/types";

function galleryFor(glamping: Glamping): GlampingImage[] {
  const images = (glamping.images ?? []).filter((image) => Boolean(image.url));
  if (images.length) return images;
  return [
    {
      id: `${glamping.id}-main`,
      glampingId: glamping.id,
      url: glamping.mainImage || "/images/glamping-bosque.jpg",
      alt: glamping.name,
      sortOrder: 0,
      isMain: true,
    },
  ];
}

export default function GlampingQuickView({
  item,
  glamping,
  checkIn,
  checkOut,
  nights,
  guests,
  selected,
  onChoose,
  onClose,
}: {
  item: AvailabilityItem;
  glamping: Glamping;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  selected: boolean;
  onChoose: () => void;
  onClose: () => void;
}) {
  const images = useMemo(() => galleryFor(glamping), [glamping]);
  const [active, setActive] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!hasMultiple) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActive((value) => (value + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActive((value) => (value - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasMultiple, images.length, onClose]);

  const nightlyRate = item.quote?.nightlyRate ?? glamping.pricePerNight;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glamping-quick-view-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:max-h-[90vh] sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur transition hover:bg-ink/80"
          aria-label="Cerrar vista del glamping"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto overscroll-contain">
          <div className="relative aspect-[4/3] bg-cream-200 sm:aspect-[16/9]">
            <SmartImage
              src={images[active]?.url ?? glamping.mainImage ?? "/images/glamping-bosque.jpg"}
              alt={images[active]?.alt || glamping.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 900px"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/10" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-14">
              <span className={`badge ${item.available ? "bg-lime-400 text-ink" : "bg-red-600 text-white"}`}>
                {item.available ? "Disponible" : "No disponible"}
              </span>
              {selected && <span className="badge bg-white/95 text-jungle-700">Elegido</span>}
              <span className="badge bg-white/90 text-jungle-700">
                <Icon name="users" className="h-3 w-3" /> {glamping.capacity}
              </span>
            </div>

            <div className="absolute bottom-3 left-4 right-16">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-lime-400">{glamping.tagline || "Glamping"}</p>
              <h2 id="glamping-quick-view-title" className="mt-1 font-display text-2xl uppercase leading-none text-white sm:text-3xl">
                {glamping.name}
              </h2>
            </div>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => setActive((value) => (value - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/45 text-white backdrop-blur transition hover:bg-ink/75 sm:left-4"
                  aria-label="Foto anterior"
                >
                  <Icon name="chevron-left" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActive((value) => (value + 1) % images.length)}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/45 text-white backdrop-blur transition hover:bg-ink/75 sm:right-4"
                  aria-label="Foto siguiente"
                >
                  <Icon name="chevron-right" className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 sm:px-7">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    active === index ? "border-jungle-600" : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                  aria-label={`Ver foto ${index + 1} de ${images.length}`}
                >
                  <SmartImage src={image.url} alt={image.alt || glamping.name} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-5 sm:p-7">
            <p className="flex items-center gap-1.5 text-xs text-ink/45">
              <Icon name="pin" className="h-3.5 w-3.5 text-jungle-600" />
              {glamping.location || "Cañón del Magdalena, Huila"}
            </p>

            {glamping.shortDescription && (
              <p className="mt-3 text-sm leading-6 text-ink/65">{glamping.shortDescription}</p>
            )}
            {glamping.description && glamping.description !== glamping.shortDescription && (
              <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm leading-6 text-ink/55">{glamping.description}</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-cream-50 p-3">
                <Icon name="users" className="h-4 w-4 text-jungle-600" />
                <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Capacidad</p>
                <p className="text-sm font-bold">{glamping.capacity} huéspedes</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-3">
                <Icon name="bed" className="h-4 w-4 text-jungle-600" />
                <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Habitaciones</p>
                <p className="text-sm font-bold">{glamping.bedrooms}</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-3">
                <Icon name="bath" className="h-4 w-4 text-jungle-600" />
                <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Baños</p>
                <p className="text-sm font-bold">{glamping.bathrooms}</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-3">
                <Icon name="size" className="h-4 w-4 text-jungle-600" />
                <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Tamaño</p>
                <p className="text-sm font-bold">{glamping.sizeM2 ? `${glamping.sizeM2} m²` : "—"}</p>
              </div>
            </div>

            {glamping.amenities.length > 0 && (
              <div className="mt-5">
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Comodidades</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {glamping.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-ink/55">{amenity}</span>
                  ))}
                </div>
              </div>
            )}

            {glamping.includes.length > 0 && (
              <div className="mt-5">
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Incluye</h3>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {glamping.includes.map((entry) => (
                    <li key={entry} className="flex items-start gap-1.5 text-[12px] leading-5 text-ink/55">
                      <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" /> {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-ink/[0.07] bg-cream-50 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Por noche</p>
                  <p className="font-display text-2xl">{formatCOP(nightlyRate)}</p>
                </div>
                {item.quote && (
                  <div className="text-right">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">
                      {item.quote.nights} {item.quote.nights === 1 ? "noche" : "noches"} · total
                    </p>
                    <p className="text-lg font-bold text-jungle-700">{formatCOP(item.quote.total)}</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] text-ink/40">
                {formatDate(checkIn)} → {formatDate(checkOut)} · {guests} {guests === 1 ? "huésped" : "huéspedes"} · {nights} {nights === 1 ? "noche" : "noches"}
              </p>
              {item.quote && <p className="mt-1 text-[10px] text-ink/35">{item.quote.rateName}</p>}
            </div>

            {!item.available && item.reason && (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{item.reason}</p>
            )}
          </div>
        </div>

        <div className="border-t border-ink/10 bg-white p-4 sm:px-7">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onChoose} disabled={!item.available} className="btn-lime flex-1">
              {selected ? (
                <>
                  <Icon name="check" className="h-4 w-4" /> Elegido
                </>
              ) : (
                <>
                  Elegir este refugio <Icon name="arrow" className="h-4 w-4" />
                </>
              )}
            </button>
            <Link href={`/glampings/${glamping.slug}`} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center">
              Ver ficha completa <Icon name="external" className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-2 text-center text-[10px] text-ink/35 sm:hidden">
            Desliza o toca las miniaturas para ver todas las fotos.
          </p>
        </div>
      </div>
    </div>
  );
}
