import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import GlampingGallery from "@/components/shared/GlampingGallery";
import AvailabilityBox from "@/components/forms/AvailabilityBox";
import ActivityCard from "@/components/shared/ActivityCard";
import Reveal from "@/components/shared/Reveal";
import Icon from "@/components/ui/Icon";
import SmartImage from "@/components/ui/SmartImage";
import { getGlampingBySlug, getGlampingDetails, listGlampings } from "@/lib/data/glampings";
import { listActivities } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const glamping = await getGlampingBySlug(slug).catch(() => null);
  if (!glamping) return { title: "Alojamiento no encontrado" };
  return {
    title: glamping.name,
    description: glamping.shortDescription || glamping.tagline,
    openGraph: {
      title: `${glamping.name} · Adrenalina Extrema Huila`,
      description: glamping.shortDescription,
      images: glamping.mainImage ? [glamping.mainImage] : undefined,
    },
  };
}

export default async function GlampingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [glamping, activities, settings, all] = await Promise.all([
    getGlampingDetails(slug),
    listActivities(),
    getSettings(),
    listGlampings(),
  ]);

  if (!glamping || !glamping.active) notFound();

  const images = glamping.images?.length
    ? glamping.images
    : [{ id: "main", glampingId: glamping.id, url: glamping.mainImage, alt: glamping.name, sortOrder: 0, isMain: true }];

  const rates = (glamping.rates ?? []).filter((rate) => rate.active);
  const relatedActivities = activities.filter((activity) => activity.featured).slice(0, 3);
  const others = all.filter((item) => item.id !== glamping.id).slice(0, 3);
  const maxGuests = Math.min(settings.booking.maxGuests, glamping.capacity);

  return (
    <>
      <PageHero
        eyebrow={`${glamping.tagline || "Glamping"} · ${glamping.location || "Cañón del Magdalena"}`}
        title={glamping.name}
        description={glamping.shortDescription}
        image={glamping.mainImage || "/images/glamping-bosque.jpg"}
      >
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">
          <span className="flex items-center gap-2"><Icon name="users" className="h-4 w-4 text-lime-400" /> {glamping.capacity} huéspedes</span>
          <span className="flex items-center gap-2"><Icon name="bed" className="h-4 w-4 text-lime-400" /> {glamping.bedrooms} habitación{glamping.bedrooms === 1 ? "" : "es"}</span>
          <span className="flex items-center gap-2"><Icon name="bath" className="h-4 w-4 text-lime-400" /> {glamping.bathrooms} baño{glamping.bathrooms === 1 ? "" : "s"}</span>
          {glamping.sizeM2 ? <span className="flex items-center gap-2"><Icon name="size" className="h-4 w-4 text-lime-400" /> {glamping.sizeM2} m²</span> : null}
          <span className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 text-lime-400" /> {glamping.location}</span>
        </div>
      </PageHero>

      <div className="border-b border-ink/10 bg-cream-50">
        <div className="container-site flex items-center justify-between gap-4 py-4">
          <nav className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">
            <Link href="/" className="transition hover:text-jungle-700">Inicio</Link>
            <span>/</span>
            <Link href="/glampings" className="transition hover:text-jungle-700">Glampings</Link>
            <span>/</span>
            <span className="text-ink/70">{glamping.name}</span>
          </nav>
          <Link href="/reservar" className="hidden items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-jungle-700 sm:flex">
            Reservar ahora <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <section className="py-10 sm:py-14">
        <div className="container-site grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-14">
          <div>
            <GlampingGallery images={images} name={glamping.name} />

            <Reveal className="mt-10">
              <div className="flex flex-col gap-4 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">La experiencia</p>
                  <h2 className="mt-3 text-3xl uppercase sm:text-4xl">{glamping.tagline || "Tu refugio en el cañón"}</h2>
                </div>
                <div className="shrink-0 rounded-xl bg-jungle-50 px-5 py-3 text-right">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-jungle-700/60">Desde / noche</p>
                  <p className="font-display text-2xl text-jungle-700">{formatCOP(glamping.pricePerNight)}</p>
                </div>
              </div>
              <div className="prose-aeh mt-6 whitespace-pre-line">
                {glamping.description || glamping.shortDescription}
              </div>
            </Reveal>

            <Reveal className="mt-10">
              <h3 className="text-2xl uppercase">Lo que incluye este refugio</h3>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {glamping.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-white px-4 py-3 text-sm text-ink/70">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-100 text-jungle-700">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    {amenity}
                  </div>
                ))}
              </div>
            </Reveal>

            {glamping.includes.length > 0 && (
              <Reveal className="mt-8 rounded-2xl bg-jungle-950 p-6 text-white sm:p-8">
                <p className="eyebrow-light">Incluido en tu estadía</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {glamping.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                      <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /> {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Tarifas</p>
                  <h3 className="mt-2 text-2xl uppercase">Temporadas y precios</h3>
                </div>
                <p className="text-[10px] text-ink/40">Precios en COP por noche</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-ink/10 bg-white p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Entre semana</p>
                  <p className="mt-1 font-display text-2xl">{formatCOP(glamping.pricePerNight)}</p>
                  <p className="text-[10px] text-ink/40">Lunes a viernes</p>
                </div>
                <div className="rounded-xl border border-jungle-600/20 bg-jungle-50 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-jungle-700/60">Fin de semana</p>
                  <p className="mt-1 font-display text-2xl text-jungle-700">{formatCOP(glamping.weekendPricePerNight ?? glamping.pricePerNight)}</p>
                  <p className="text-[10px] text-jungle-700/50">Sábado y domingo</p>
                </div>
                <div className="rounded-xl border border-sun-400/40 bg-sun-100/40 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-yellow-800/70">Festivo</p>
                  <p className="mt-1 font-display text-2xl text-yellow-900">{formatCOP(glamping.holidayPricePerNight ?? glamping.pricePerNight)}</p>
                  <p className="text-[10px] text-yellow-800/50">Festivos colombianos</p>
                </div>
              </div>

              {rates.length > 0 && (
                <>
                  <p className="mt-6 text-[10px] text-ink/40">
                    En temporadas especiales se aplica la tarifa de temporada. Precedencia por noche: temporada &gt; festivo &gt; fin de semana &gt; base.
                  </p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-ink/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-cream-100 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                        <tr>
                          <th className="px-4 py-3">Temporada</th>
                          <th className="px-4 py-3">Fechas</th>
                          <th className="px-4 py-3">Mínimo</th>
                          <th className="px-4 py-3 text-right">Por noche</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/[0.06] bg-white">
                        {rates.map((rate) => (
                          <tr key={rate.id}>
                            <td className="px-4 py-3 font-semibold">{rate.name}</td>
                            <td className="px-4 py-3 text-ink/55">{rate.startDate} → {rate.endDate}</td>
                            <td className="px-4 py-3 text-ink/55">{rate.minNights} noche{rate.minNights === 1 ? "" : "s"}</td>
                            <td className="px-4 py-3 text-right font-display text-lg">{formatCOP(rate.pricePerNight)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Reveal>

            {glamping.conditions && (
              <Reveal className="mt-8">
                <div className="rounded-xl border border-sun-400/40 bg-sun-100/50 p-5">
                  <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-yellow-800">
                    <Icon name="alert" className="h-4 w-4" /> Condiciones del alojamiento
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/65">{glamping.conditions}</p>
                </div>
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AvailabilityBox
              glampingId={glamping.id}
              glampingSlug={glamping.slug}
              basePrice={glamping.pricePerNight}
              weekendPrice={glamping.weekendPricePerNight}
              holidayPrice={glamping.holidayPricePerNight}
              capacity={glamping.capacity}
              maxGuests={maxGuests}
            />
            <div className="mt-4 rounded-2xl border border-ink/10 bg-cream-50 p-5 text-sm">
              <p className="flex items-center gap-2 font-bold"><Icon name="clock" className="h-4 w-4 text-jungle-600" /> Check-in {settings.booking.checkInTime} · Check-out {settings.booking.checkOutTime}</p>
              <p className="mt-2 text-xs leading-6 text-ink/50">
                La reserva se asegura con el {settings.booking.depositPercent}% de anticipo. El saldo se paga al llegar o por transferencia.
              </p>
              <a
                href={`https://wa.me/${settings.business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quiero información sobre ${glamping.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-full border border-jungle-600/20 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-jungle-700 transition hover:bg-jungle-600 hover:text-white"
              >
                <Icon name="whatsapp" className="h-4 w-4" /> Preguntar por este glamping
              </a>
            </div>
          </aside>
        </div>
      </section>

      {relatedActivities.length > 0 && (
        <section className="bg-jungle-950 py-16 text-white sm:py-20">
          <div className="container-site">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow-light">Completa tu plan</p>
                <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Aventura a la vuelta de la cama</h2>
              </div>
              <Link href="/actividades" className="link-arrow !text-lime-400 hover:!text-white">
                Ver todas <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {relatedActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="container-site">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Sigue explorando</p>
                <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Otros refugios</h2>
              </div>
              <Link href="/glampings" className="link-arrow">Ver catálogo completo <Icon name="arrow" className="h-4 w-4" /></Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {others.map((item) => (
                <Link key={item.id} href={`/glampings/${item.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ink">
                  <SmartImage src={item.mainImage || "/images/glamping-bosque.jpg"} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-lime-400">{formatCOP(item.pricePerNight)} / noche</p>
                    <p className="mt-1 font-display text-2xl uppercase leading-none">{item.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
