import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import ActivitiesCatalog from "@/components/shared/ActivitiesCatalog";
import Reveal from "@/components/shared/Reveal";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { listActivities, listServices } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actividades y aventura",
  description: "Rafting, escalada, cascadas, cabalgatas y senderismo guiado en el Cañón del Magdalena, Huila.",
};

export default async function ActivitiesPage() {
  const [activities, services, settings] = await Promise.all([listActivities(), listServices(), getSettings()]);
  const whatsapp = `https://wa.me/${settings.business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hola, quiero información sobre las actividades de Adrenalina Extrema Huila.",
  )}`;

  return (
    <>
      <PageHero
        eyebrow="Aventura"
        title="El cañón es el parque"
        description="Siete experiencias guiadas para medir tu adrenalina. Equipo incluido, grupos pequeños y guías que conocen cada piedra del río."
        image="/images/act-rafting.jpg"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/reservar" className="btn-lime">Reservar experiencia <Icon name="arrow" className="h-4 w-4" /></Link>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline-light">
            <Icon name="whatsapp" className="h-4 w-4" /> Preguntar disponibilidad
          </a>
        </div>
      </PageHero>

      <section className="py-14 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Experiencias</p>
                <h2 className="section-title mt-3">Elige tu nivel de locura</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/55">
                Todas las actividades se pueden agregar a tu reserva de glamping o tomar por separado. Los precios son por persona, salvo que se indique otra unidad.
              </p>
            </div>
          </Reveal>
          <ActivitiesCatalog activities={activities} />
        </div>
      </section>

      <section className="border-y border-ink/10 bg-cream-100 py-16 sm:py-20">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Servicios adicionales</p>
              <h2 className="section-title mt-3">Los detalles que<br />hacen la diferencia</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ink/55">
              Agrega transporte, comidas o una sorpresa especial al momento de reservar.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 0.05}>
                <article className="group flex h-full gap-4 overflow-hidden rounded-xl border border-ink/[0.07] bg-white p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    <SmartImage src={service.image || "/images/serv-desayuno.jpg"} alt={service.name} fill sizes="96px" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="text-lg uppercase leading-none">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/50">{service.description}</p>
                    <p className="mt-auto pt-2 text-sm font-bold text-jungle-700">
                      {formatCOP(service.price)} <span className="text-[9px] font-medium uppercase tracking-wider text-ink/35">/ {service.priceUnit}</span>
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-jungle-950 py-16 text-white">
        <div className="container-site grid gap-8 sm:grid-cols-3">
          {[
            { icon: "shield" as const, title: "Seguridad real", text: "Guías certificados, equipo revisado y protocolos claros para cada actividad." },
            { icon: "users" as const, title: "Grupos pequeños", text: "Máximo 10 personas por salida para que la experiencia sea cercana." },
            { icon: "leaf" as const, title: "Turismo responsable", text: "Senderos señalizados, residuos gestionados y respeto por la comunidad." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl uppercase">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
