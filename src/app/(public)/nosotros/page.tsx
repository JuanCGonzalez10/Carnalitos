import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import SectionHeading from "@/components/shared/SectionHeading";
import Reveal from "@/components/shared/Reveal";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { buildWhatsAppUrl, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestra historia",
  description:
    "Conoce Carnalitos: una tienda colombiana de snacks y comida saludable para perros y gatos, hecha con ingredientes reales.",
};

const VALUES = [
  {
    icon: "leaf" as const,
    title: "Ingredientes de verdad",
    text: "Proteína, verduras y cereales integrales. Sin harinas de relleno, conservantes ni colorantes artificiales.",
  },
  {
    icon: "shield" as const,
    title: "Producción cuidada",
    text: "Trabajamos en lotes pequeños para controlar la calidad y la frescura de cada producto.",
  },
  {
    icon: "paw" as const,
    title: "Pensado para ellos",
    text: "Recetas para perros y gatos, con porciones y texturas adaptadas a sus necesidades.",
  },
  {
    icon: "heart" as const,
    title: "Consentir es cuidar",
    text: "Creemos que un premio también puede ser una forma de nutrición y bienestar.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const whatsapp = buildWhatsAppUrl(settings.business.whatsapp, "Hola Carnalitos, quiero conocer más sobre sus productos.");

  return (
    <>
      <PageHero
        eyebrow="Nuestra historia"
        title="Hecho con calma, pensado con amor"
        description="Carnalitos nació para que consentir a tu mascota no signifique elegir entre sabor y bienestar."
        image="/images/brand/page-hero.svg"
      />

      <section className="py-16 sm:py-24">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="El origen"
              title={
                <>
                  Una cocina
                  <br />
                  <span className="text-jungle-600">para dos patas</span>
                  <br />
                  y cuatro
                </>
              }
              description="Empezamos preparando premios para nuestras propias mascotas. Queríamos algo que pudieran comer todos los días, con ingredientes que reconocemos y sin esas listas interminables de aditivos que no entendemos."
            />
            <div className="mt-6 space-y-4 text-sm leading-7 text-ink/60">
              <p>
                Con el tiempo, la cocina se llenó de recetas: pollo deshidratado, galletas de avena,
                croquetas con verduras y premios de entrenamiento. Cada una nació de una necesidad
                concreta y de muchas pruebas hasta dar con la textura y el sabor correctos.
              </p>
              <p>
                Hoy Carnalitos es una tienda colombiana que trabaja con proveedores locales y produce
                en lotes pequeños. No somos una fábrica: somos una cocina que cuida cada pedido como
                si fuera para nuestra propia mascota.
              </p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/tienda" className="btn-lime">
                Conoce los productos <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Icon name="whatsapp" className="h-4 w-4" /> Escríbenos
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-ink/[0.07] bg-white">
              <SmartImage
                src="/images/brand/page-hero.svg"
                alt="Productos Carnalitos"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-cream-100 py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="Lo que nos mueve"
              title={
                <>
                  Cuatro cosas
                  <br />
                  que no negociamos
                </>
              }
              description="Son la base de cada receta y de cada decisión que tomamos en la tienda."
              align="center"
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <Reveal key={value.title} delay={index * 0.06}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-jungle-50 text-jungle-700">
                    <Icon name={value.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl uppercase leading-tight">{value.title}</h3>
                  <p className="mt-2 text-[12px] leading-6 text-ink/50">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-site grid gap-8 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="rounded-3xl bg-jungle-950 p-7 text-white sm:p-10">
              <p className="eyebrow-light">Nuestra promesa</p>
              <h2 className="mt-4 text-4xl uppercase leading-[0.92] sm:text-5xl">
                Si no se lo darías
                <br />
                a tu mascota,
                <br />
                <span className="text-lime-400">no sale de aquí</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/55">
                Esa es la regla. No usamos nada que no pondríamos en el plato de nuestra propia
                mascota y explicamos cada ingrediente con claridad.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { value: "100%", label: "Ingredientes reales" },
                  { value: "0", label: "Conservantes artificiales" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-display text-3xl leading-none text-lime-400">{stat.value}</p>
                    <p className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeading
              eyebrow="Preguntas frecuentes"
              title={
                <>
                  Antes de
                  <br />
                  pedir
                </>
              }
            />
            <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
              {[
                {
                  q: "¿Los productos son para perros y gatos?",
                  a: "Tenemos recetas para ambos. Cada producto indica en su ficha para qué tipo de mascota está pensado.",
                },
                {
                  q: "¿Cómo se realiza el pago?",
                  a: "Puedes pagar contraentrega en Medellín, por Nequi o por transferencia bancaria. Al confirmar el pedido te compartimos los datos.",
                },
                {
                  q: "¿Hacen envíos fuera de Medellín?",
                  a: "Por ahora nuestras entregas son exclusivas en Medellín para garantizar la máxima frescura y calidad de cada lote artesanal.",
                },
                {
                  q: "¿Puedo recoger en tienda?",
                  a: settings.store.pickupAddress + " · " + settings.store.pickupSchedule,
                },
              ].map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-ink/80">
                    {item.q}
                    <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink/30 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-[12px] leading-6 text-ink/50">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
