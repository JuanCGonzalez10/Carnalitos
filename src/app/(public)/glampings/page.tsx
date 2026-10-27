import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import GlampingsCatalog from "@/components/shared/GlampingsCatalog";
import Reveal from "@/components/shared/Reveal";
import Icon from "@/components/ui/Icon";
import { listGlampings } from "@/lib/data/glampings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Glampings",
  description: "Domo, cabaña, safari y suite con vista al Cañón del Magdalena. Compara capacidad, comodidades y tarifas.",
};

export default async function GlampingsPage() {
  const glampings = await listGlampings();

  return (
    <>
      <PageHero
        eyebrow="Alojamientos"
        title="Duerme donde termina el mapa"
        description="Cinco formas de dormir en el cañón. Todas con naturaleza alrededor, silencio y una cama que da pereza dejar."
        image="/images/glamping-bosque.jpg"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/reservar" className="btn-lime">Reservar ahora <Icon name="arrow" className="h-4 w-4" /></Link>
          <Link href="/actividades" className="btn-outline-light">Ver actividades</Link>
        </div>
      </PageHero>

      <section className="py-14 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Catálogo</p>
                <h2 className="section-title mt-3">Elige tu refugio</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/55">
                Las tarifas son por noche y en pesos colombianos. La disponibilidad se confirma en tiempo real al reservar.
              </p>
            </div>
          </Reveal>
          <GlampingsCatalog glampings={glampings} />
        </div>
      </section>

      <section className="border-t border-ink/10 bg-cream-100 py-14">
        <div className="container-site flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">¿No sabes cuál elegir?</p>
            <p className="mt-2 font-display text-2xl uppercase">Te ayudamos a armar la experiencia.</p>
          </div>
          <Link href="/contacto" className="btn-dark">Hablar con el equipo <Icon name="arrow" className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
