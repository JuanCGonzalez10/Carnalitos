import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/shared/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import GlampingCard from "@/components/shared/GlampingCard";
import ActivityCard from "@/components/shared/ActivityCard";
import BookingSearchBar from "@/components/forms/BookingSearchBar";
import { listFeaturedGlampings } from "@/lib/data/glampings";
import { listActivities, listGallery } from "@/lib/data/catalog";
import { getSettings, buildWhatsAppUrl } from "@/lib/settings";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

const MARQUEE = ["Glamping", "Rafting", "Cañón del Magdalena", "Senderismo", "Naturaleza", "Fogata", "Aventura", "Huila"];

const DAY = [
  { time: "07:00", title: "Café entre la niebla", text: "Amanecer en la terraza, café del Huila y el cañón apareciendo poco a poco." },
  { time: "09:00", title: "Al agua o a la montaña", text: "Rafting, cascada o senderismo. Tú eliges cuánta adrenalina quieres hoy." },
  { time: "16:00", title: "Pausa sin señal", text: "Hamaca, jacuzzi o una siesta larga. El único plan obligatorio es ninguno." },
  { time: "19:00", title: "Fuego y cielo abierto", text: "Fogata, comida sencilla y un cielo que parece mentira." },
];

export default async function HomePage() {
  const [glampings, activities, gallery, settings] = await Promise.all([
    listFeaturedGlampings(),
    listActivities(),
    listGallery(),
    getSettings(),
  ]);
  const whatsapp = buildWhatsAppUrl(
    settings.business.whatsapp,
    "Hola, quiero información para una experiencia en Adrenalina Extrema Huila.",
  );
  const minPrice = glampings.length ? Math.min(...glampings.map((g) => g.pricePerNight)) : 380000;
  const galleryPreview = gallery.slice(0, 6);

  return (
    <>
      {/* HERO */}
      <header className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink">
        <SmartImage
          src="/images/portada-adxx.png"
          alt="Cañón del Magdalena al amanecer"
          fill
          priority
          sizes="100vw"
          className="animate-ken-burns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/10 to-transparent" />
        <div className="hero-noise absolute inset-0 opacity-30" />

        <div className="container-site relative pb-8 pt-32 sm:pb-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-lime-400" />
              <p className="eyebrow-light">Glamping · Aventura · Actividades extremas</p>
            </div>
            <h1 className="mt-5 text-[17vw] uppercase leading-[0.82] text-white sm:text-[12vw] lg:text-[9.4rem]">
              Vive la
              <br />
              <span className="text-lime-400">adrenalina</span> sin
              <br />
              límites
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/70 sm:text-base">
              Dormir bajo las estrellas, vivir lo extremo y despertar rodeado de montañas.
              Un refugio de aventura con el confort que necesitas para quedarte un día más.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/reservar" className="btn-lime">
                Reservar ahora <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="/glampings" className="btn-outline-light">
                Explorar glampings
              </Link>
            </div>
          </div>

          <div className="mt-10 max-w-4xl">
            <BookingSearchBar maxGuests={settings.booking.maxGuests} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            <span className="flex items-center gap-2"><Icon name="tent" className="h-3.5 w-3.5 text-lime-400" /> 6 alojamientos</span>
            <span className="flex items-center gap-2"><Icon name="mountain" className="h-3.5 w-3.5 text-lime-400" /> {activities.length} experiencias</span>
            <span className="flex items-center gap-2"><Icon name="money" className="h-3.5 w-3.5 text-lime-400" /> Desde {formatCOP(minPrice)} / noche</span>
            <span className="hidden items-center gap-2 sm:flex"><Icon name="pin" className="h-3.5 w-3.5 text-lime-400" /> {settings.business.address}</span>
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-ink/10 bg-lime-400 py-3 text-ink">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {MARQUEE.map((item) => (
                <span key={`${copy}-${item}`} className="flex items-center whitespace-nowrap px-6 font-display text-sm uppercase tracking-[0.14em] sm:text-base">
                  {item} <span className="ml-6 text-[8px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* INTRO */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="El lugar"
              title={<>No es un hotel.<br /><span className="text-jungle-600">Es una forma</span><br />de estar vivo.</>}
              description="Adrenalina Extrema nace de una idea simple: que la naturaleza no se mira desde lejos. Aquí el río está cerca, la montaña se sube y la noche se comparte alrededor del fuego."
            />
            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-ink/10 pt-8 sm:grid-cols-4">
              {[
                { value: "6", label: "Alojamientos" },
                { value: "6", label: "Experiencias" },
                { value: "360°", label: "Naturaleza" },
                { value: "0", label: "Miedos" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-4xl text-jungle-700">{stat.value}</p>
                  <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <SmartImage src="/images/imagenpp.jpg" alt="Glamping en el bosque" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-lime-400">Cañón del Magdalena</p>
                  <p className="mt-1 font-display text-2xl uppercase">Donde empieza la aventura</p>
                </div>
                <Icon name="mountain" className="h-10 w-10 text-lime-400" />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 hidden w-48 rounded-2xl border border-ink/10 bg-white p-5 shadow-xl sm:block">
              <div className="flex gap-0.5 text-jungle-600">
                {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="mt-2 font-display text-lg uppercase leading-tight">Naturaleza sin filtro</p>
              <p className="mt-1 text-[10px] text-ink/45">Aventura + descanso + buena comida</p>
            </div>
            <div className="absolute -right-3 -top-4 hidden rounded-full bg-sun-400 px-5 py-4 text-center text-ink shadow-lg sm:block">
              <p className="font-display text-2xl leading-none">100%</p>
              <p className="text-[8px] font-extrabold uppercase tracking-widest">Aventura</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* GLAMPINGS */}
      <section className="bg-cream-100 py-20 sm:py-28">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading
                eyebrow="Elige dónde dormir"
                title={<>Tu base en<br />la montaña</>}
                description="Domo, cabaña, glamping o camping. Todos con vista, silencio y una cama que da pereza dejar."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/glampings" className="link-arrow">
                Ver todos los glampings <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {glampings.map((glamping, index) => (
              <Reveal key={glamping.id} delay={index * 0.07}>
                <GlampingCard glamping={glamping} index={index} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVIDADES */}
      <section className="relative overflow-hidden bg-jungle-950 py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-jungle-500/20 blur-3xl" />
        <div className="container-site relative">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading
                eyebrow="Adrenalina"
                title={<>Elige tu<br /><span className="text-lime-400">nivel de locura</span></>}
                description="Rafting, senderismo, escalada canopy, hamacas y mucho más. Actividades guiadas, equipo incluido y cero experiencia previa."
                light
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/actividades" className="link-arrow !text-lime-400 hover:!text-white">
                Ver todas las actividades <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {activities.slice(0, 3).map((activity, index) => (
              <Reveal key={activity.id} delay={index * 0.08}>
                <ActivityCard activity={activity} />
              </Reveal>
            ))}
          </div>
          <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-3 sm:p-6">
            {[
              { icon: "shield" as const, title: "Guías certificados", text: "Seguridad primero, siempre." },
              { icon: "users" as const, title: "Grupos pequeños", text: "Atención cercana y personalizada." },
              { icon: "leaf" as const, title: "Bajo impacto", text: "Respetamos el entorno que nos acoge." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-[11px] text-white/45">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UN DÍA */}
      <section className="py-20 sm:py-28">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <SectionHeading eyebrow="El ritmo" title={<>Un día que<br />se hace largo</>} description="Sin horarios rígidos. La única agenda es la que tú quieras: aventura, descanso o las dos cosas." />
            <div className="mt-9 space-y-0">
              {DAY.map((item, index) => (
                <div key={item.time} className="relative flex gap-5 pb-7 last:pb-0">
                  {index < DAY.length - 1 && <span className="absolute left-[23px] top-9 h-full w-px bg-ink/10" />}
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-jungle-600/20 bg-jungle-50 font-display text-xs text-jungle-700">
                    {item.time}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-xl uppercase leading-none">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/55">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[5/6]">
              <SmartImage src="/images/undia.jpg" alt="Fogata al atardecer" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/15 bg-ink/40 p-4 backdrop-blur">
                <p className="font-display text-2xl uppercase text-white">La noche es otra experiencia</p>
                <p className="mt-1 text-xs text-white/55">Fogata, chocolate caliente y cielo abierto.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* GALERÍA */}
      <section className="border-y border-ink/10 bg-cream-100 py-20 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading eyebrow="Galería" title={<>Así se ve<br />la aventura</>} />
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/galeria" className="link-arrow">Abrir galería completa <Icon name="arrow" className="h-4 w-4" /></Link>
            </Reveal>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {galleryPreview.map((image, index) => (
              <Reveal key={image.id} delay={index * 0.04} className={index === 0 ? "col-span-2 row-span-2" : ""}>
                <Link href="/galeria" className={`group relative block overflow-hidden rounded-xl ${index === 0 ? "aspect-square" : "aspect-[4/3]"}`}>
                  <SmartImage src={image.url} alt={image.alt} fill sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-ink/0 transition group-hover:bg-ink/20" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="ubicacion" className="py-20 sm:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Cómo llegar" title={<>Adrenalina Extrema<br />te está esperando</>} description="Estamos en el sur del Huila, en la región del Cañón del Magdalena. Te compartimos la ubicación exacta y las indicaciones al confirmar tu reserva." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <Icon name="pin" className="h-5 w-5 text-jungle-600" />
                <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Ubicación</p>
                <p className="mt-1 text-sm font-semibold">{settings.business.address}</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <Icon name="clock" className="h-5 w-5 text-jungle-600" />
                <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Atención</p>
                <p className="mt-1 text-sm font-semibold">{settings.business.schedule}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-jungle">
                <Icon name="whatsapp" className="h-4 w-4" /> Coordinar llegada
              </a>
              <Link href="/contacto" className="btn-outline">Escríbenos</Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-[320px] overflow-hidden rounded-2xl border border-ink/10 sm:h-[430px]">
              <iframe
                title="Ubicación de Adrenalina Extrema Huila"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.business.mapQuery)}&z=9&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-2 text-[10px] text-ink/35">Mapa de referencia. La ubicación exacta se comparte con la reserva confirmada.</p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 text-white sm:py-32">
        <SmartImage src="/images/gal-noche.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-jungle-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-jungle-950 via-jungle-950/60 to-transparent" />
        <Reveal className="container-site relative">
          <p className="eyebrow-light">Reservas directas</p>
          <h2 className="mt-4 max-w-3xl text-5xl uppercase leading-[0.9] sm:text-7xl">La aventura no se planea. Se reserva.</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">Elige tus fechas, arma tu experiencia y asegura tu lugar. Sin intermediarios, sin sorpresas.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/reservar" className="btn-lime">Reservar mi experiencia <Icon name="arrow" className="h-4 w-4" /></Link>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline-light">
              <Icon name="whatsapp" className="h-4 w-4" /> Hablar con alguien
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
