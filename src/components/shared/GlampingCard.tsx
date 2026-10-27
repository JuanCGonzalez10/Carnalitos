import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { Glamping } from "@/types";

export default function GlampingCard({ glamping, index = 0 }: { glamping: Glamping; index?: number }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
      <Link href={`/glampings/${glamping.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-cream-200">
        <SmartImage
          src={glamping.mainImage || "/images/glamping-bosque.jpg"}
          alt={glamping.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[1.3s] ease-luxe group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-70" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="badge bg-white/95 text-jungle-700 backdrop-blur">
            <Icon name="tent" className="h-3 w-3" /> Glamping
          </span>
          {glamping.featured && <span className="badge bg-lime-400 text-ink">Destacado</span>}
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[11px] font-bold text-white">
          <span className="flex items-center gap-1.5"><Icon name="users" className="h-3.5 w-3.5" /> {glamping.capacity} huéspedes</span>
          {glamping.sizeM2 && <span className="flex items-center gap-1.5"><Icon name="size" className="h-3.5 w-3.5" /> {glamping.sizeM2} m²</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-jungle-600">{String(index + 1).padStart(2, "0")} · {glamping.tagline}</p>
            <h3 className="mt-2 text-2xl uppercase leading-none">
              <Link href={`/glampings/${glamping.slug}`} className="transition hover:text-jungle-700">{glamping.name}</Link>
            </h3>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/60">{glamping.shortDescription}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {glamping.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-ink/55">{amenity}</span>
          ))}
          {glamping.amenities.length > 3 && (
            <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-ink/40">+{glamping.amenities.length - 3}</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink/[0.07] pt-5">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Desde / noche</p>
            <p className="mt-1 font-display text-2xl text-ink">{formatCOP(glamping.pricePerNight)}</p>
          </div>
          <Link href={`/reservar?glamping=${glamping.slug}`} className="btn-dark btn-sm">
            Reservar <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
