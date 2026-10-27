import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import ActivityCard from "@/components/shared/ActivityCard";
import Reveal from "@/components/shared/Reveal";
import Icon from "@/components/ui/Icon";
import { getActivityBySlug, listActivities } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug).catch(() => null);
  if (!activity) return { title: "Actividad no encontrada" };
  return {
    title: activity.name,
    description: activity.shortDescription,
    openGraph: {
      title: `${activity.name} · Adrenalina Extrema Huila`,
      description: activity.shortDescription,
      images: activity.image ? [activity.image] : undefined,
    },
  };
}

export default async function ActivityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [activity, activities, settings] = await Promise.all([
    getActivityBySlug(slug),
    listActivities(),
    getSettings(),
  ]);

  if (!activity || !activity.active) notFound();

  const related = activities.filter((item) => item.id !== activity.id).slice(0, 3);
  const whatsapp = `https://wa.me/${settings.business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola, quiero información sobre la actividad ${activity.name}.`,
  )}`;
  const details = [
    { icon: "clock" as const, label: "Duración", value: activity.duration || "Por confirmar" },
    { icon: "mountain" as const, label: "Dificultad", value: activity.difficulty || "Media" },
    { icon: "users" as const, label: "Edad mínima", value: `${activity.minAge} años` },
    { icon: "tent" as const, label: "Cupo por salida", value: activity.maxPeople ? `${activity.maxPeople} personas` : "Grupo pequeño" },
  ];

  return (
    <>
      <PageHero
        eyebrow={`${activity.category} · ${activity.difficulty}`}
        title={activity.name}
        description={activity.shortDescription}
        image={activity.image || "/images/act-senderismo.jpg"}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="rounded-full bg-lime-400 px-5 py-2.5 font-display text-xl text-ink">{formatCOP(activity.price)}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">por {activity.priceUnit}</span>
          {(activity.weekendPrice != null || activity.holidayPrice != null) && (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
              Fin de semana y festivos con tarifa especial
            </span>
          )}
        </div>
      </PageHero>

      <div className="border-b border-ink/10 bg-cream-50">
        <div className="container-site flex items-center justify-between gap-4 py-4">
          <nav className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">
            <Link href="/" className="transition hover:text-jungle-700">Inicio</Link>
            <span>/</span>
            <Link href="/actividades" className="transition hover:text-jungle-700">Actividades</Link>
            <span>/</span>
            <span className="text-ink/70">{activity.name}</span>
          </nav>
          <Link href="/reservar" className="hidden items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-jungle-700 sm:flex">
            Reservar ahora <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <section className="py-12 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-14">
          <div>
            <Reveal>
              <p className="eyebrow">La experiencia</p>
              <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Adrenalina con contexto</h2>
              <div className="prose-aeh mt-5 whitespace-pre-line">{activity.description || activity.shortDescription}</div>
            </Reveal>

            <Reveal className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-xl border border-ink/[0.07] bg-white p-4">
                  <Icon name={detail.icon} className="h-5 w-5 text-jungle-600" />
                  <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/35">{detail.label}</p>
                  <p className="mt-1 text-sm font-bold">{detail.value}</p>
                </div>
              ))}
            </Reveal>

            {activity.includes.length > 0 && (
              <Reveal className="mt-9">
                <h3 className="text-2xl uppercase">Qué incluye</h3>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {activity.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink/70">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" strokeWidth={2.5} /> {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {activity.requirements && (
              <Reveal className="mt-8">
                <div className="rounded-xl border border-sun-400/40 bg-sun-100/50 p-5">
                  <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-yellow-800">
                    <Icon name="alert" className="h-4 w-4" /> Ten en cuenta
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/65">{activity.requirements}</p>
                </div>
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Precio por {activity.priceUnit}</p>
              <p className="mt-1 font-display text-4xl">{formatCOP(activity.price)}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-ink/10 bg-cream-50 px-3 py-2">
                  <p className="text-[8px] font-extrabold uppercase tracking-widest text-ink/35">Fin de semana</p>
                  <p className="mt-0.5 font-display text-lg">{formatCOP(activity.weekendPrice ?? activity.price)}</p>
                </div>
                <div className="rounded-lg border border-sun-400/40 bg-sun-100/40 px-3 py-2">
                  <p className="text-[8px] font-extrabold uppercase tracking-widest text-yellow-800/70">Festivo</p>
                  <p className="mt-0.5 font-display text-lg text-yellow-900">{formatCOP(activity.holidayPrice ?? activity.price)}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-ink/40">
                El precio se aplica según la fecha de llegada de la reserva. Si dejas una tarifa sin configurar, se usa el precio base.
              </p>
              <div className="mt-5 space-y-2.5 border-y border-ink/10 py-4 text-sm text-ink/60">
                <p className="flex items-center justify-between"><span>Duración</span><span className="font-semibold text-ink">{activity.duration || "Por confirmar"}</span></p>
                <p className="flex items-center justify-between"><span>Dificultad</span><span className="font-semibold text-ink">{activity.difficulty}</span></p>
                <p className="flex items-center justify-between"><span>Edad mínima</span><span className="font-semibold text-ink">{activity.minAge} años</span></p>
              </div>
              <Link href={`/reservar?activity=${activity.slug}`} className="btn-lime mt-5 w-full">
                Agregar a mi reserva <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-jungle-700 transition hover:text-jungle-500">
                <Icon name="whatsapp" className="h-4 w-4" /> Preguntar por esta actividad
              </a>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-ink/35">
                <Icon name="shield" className="h-3 w-3 shrink-0" /> Actividad sujeta a clima y disponibilidad de guías.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-cream-100 py-16">
          <div className="container-site">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">También te puede gustar</p>
                <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Otra dosis de aventura</h2>
              </div>
              <Link href="/actividades" className="link-arrow">Ver todas <Icon name="arrow" className="h-4 w-4" /></Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <ActivityCard key={item.id} activity={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
