import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon, { type IconName } from "@/components/ui/Icon";
import Reveal from "@/components/shared/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import ProductCard from "@/components/store/ProductCard";
import HeroCarousel from "@/components/store/HeroCarousel";
import { listCategories, listFeaturedProducts, listProducts } from "@/lib/data/products";
import { buildWhatsAppUrl, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, IconName> = {
  paw: "paw",
  bone: "bone",
  heart: "heart",
  star: "star",
  utensils: "utensils",
  leaf: "leaf",
  bag: "bag",
};

const MARQUEE = [
  "Ingredientes reales",
  "Sin conservantes",
  "Hecho en Colombia",
  "Para perros y gatos",
  "Entregas en Medellín",
  "Snacks naturales",
];

const STEPS = [
  {
    icon: "bag" as const,
    title: "Elige sus favoritos",
    text: "Explora snacks, comida y premios por tipo de mascota. Cada producto tiene su historia y sus ingredientes a la vista.",
  },
  {
    icon: "truck" as const,
    title: "Recibe en casa",
    text: "Entregas exclusivas en Medellín en 24 a 48 horas. Envío gratis desde el umbral de compra.",
  },
  {
    icon: "heart" as const,
    title: "Consiente sin culpa",
    text: "Productos artesanales, porciones pensadas y opciones para mascotas con estómagos sensibles.",
  },
];

export default async function HomePage() {
  const [categories, featured, latest, settings] = await Promise.all([
    listCategories(),
    listFeaturedProducts(4),
    listProducts({ limit: 8, sort: "newest" }),
    getSettings(),
  ]);

  const products = featured.length > 0 ? featured : latest.slice(0, 4);
  const store = settings.store;
  const business = settings.business;
  const whatsappUrl = buildWhatsAppUrl(
    business.whatsapp,
    "Hola Carnalitos, quiero consentir a mi mascota. ¿Me ayudan a elegir?",
  );

  return (
    <>
      <HeroCarousel
        freeShippingThreshold={store.freeShippingThreshold}
        city={business.city}
        whatsappUrl={whatsappUrl}
      />

      <div className="overflow-hidden border-y border-ink/10 bg-lime-400 py-3 text-ink">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {MARQUEE.map((item) => (
                <span
                  key={`${copy}-${item}`}
                  className="flex items-center whitespace-nowrap px-6 font-display text-sm uppercase tracking-[0.14em] sm:text-base"
                >
                  {item} <span className="ml-6 text-[8px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="py-16 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading
                eyebrow="El menú"
                title={
                  <>
                    Encuentra su
                    <br />
                    <span className="text-jungle-600">snack favorito</span>
                  </>
                }
                description="Opciones para perros y gatos, desde premios de entrenamiento hasta comida completa. Todo con ingredientes que puedes pronunciar."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/tienda" className="link-arrow">
                Ver toda la tienda <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((category, index) => (
              <Reveal key={category.id} delay={index * 0.06}>
                <Link
                  href={`/tienda?category=${category.slug}`}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-ink/[0.07] bg-white p-6 transition hover:-translate-y-1 hover:border-lime-300 hover:shadow-xl"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-jungle-700 transition group-hover:bg-lime-400 group-hover:text-ink">
                    <Icon name={CATEGORY_ICONS[category.icon] ?? "paw"} className="h-5 w-5" />
                  </span>
                  <div className="mt-8">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-jungle-700">
                      {category.productCount ?? 0} {category.productCount === 1 ? "producto" : "productos"}
                    </p>
                    <h3 className="mt-1 text-2xl uppercase leading-none">{category.name}</h3>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink/45">
                      {category.description}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-jungle-700">
                    Explorar <Icon name="arrow" className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-cream-100 py-16 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading
                eyebrow="Los favoritos"
                title={
                  <>
                    Los que
                    <br />
                    vuelan
                  </>
                }
                description="Una selección de los productos que más piden nuestros clientes."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/tienda?sort=featured" className="link-arrow">
                Ver destacados <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.06}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
          {products.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
              <Icon name="bag" className="mx-auto h-10 w-10 text-ink/20" />
              <p className="mt-3 text-sm text-ink/50">
                Estamos preparando el catálogo. Vuelve pronto o escríbenos por WhatsApp.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="Por qué Carnalitos"
              title={
                <>
                  Comida honesta
                  <br />
                  <span className="text-jungle-600">para compañeros</span>
                  <br />
                  de verdad
                </>
              }
              description="No creemos en fórmulas mágicas. Creemos en la proteína de calidad, en la fibra de las verduras y en preparar cada lote como si fuera para nuestra propia mascota."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: "leaf" as const, title: "Ingredientes visibles", text: "Sin harinas de relleno ni saborizantes artificiales." },
                { icon: "shield" as const, title: "Lotes pequeños", text: "Producción artesanal y trazable, hecha en Colombia." },
                { icon: "paw" as const, title: "Para perros y gatos", text: "Recetas separadas según su tamaño y necesidades." },
                { icon: "heart" as const, title: "Consentir es cuidar", text: "Porciones y premios pensados para el día a día." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-ink/[0.07] bg-white p-4">
                  <Icon name={item.icon} className="h-5 w-5 text-jungle-600" />
                  <p className="mt-2 text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink/45">{item.text}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-jungle-950">
              <SmartImage
                src="/images/brand/hero-snacks.svg"
                alt="Productos naturales de Carnalitos"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jungle-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-jungle-950/60 p-5 backdrop-blur">
                <p className="eyebrow-light">Nuestra promesa</p>
                <p className="mt-2 font-display text-3xl uppercase leading-none text-white">
                  Si no se lo darías a tu mascota, no sale de nuestra cocina.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-jungle-950 py-16 text-white sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="Cómo funciona"
              title={
                <>
                  Comprar es
                  <br />
                  <span className="text-lime-400">muy fácil</span>
                </>
              }
              description="Sin suscripciones ni letra pequeña. Elige, paga contraentrega o por transferencia y recibe en casa."
              light
            />
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.08}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 text-ink">
                      <Icon name={step.icon} className="h-5 w-5" />
                    </span>
                    <span className="font-display text-4xl text-white/10">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-2xl uppercase leading-none">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:p-6">
            <p className="flex items-center gap-3 text-sm text-white/60">
              <Icon name="truck" className="h-5 w-5 shrink-0 text-lime-400" />
              {store.deliveryNote}
            </p>
            <Link href="/tienda" className="btn-lime shrink-0">
              Ir a la tienda <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-jungle-900 px-6 py-14 text-white sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lime-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-jungle-500/30 blur-3xl" />
            <Reveal className="relative max-w-3xl">
              <p className="eyebrow-light">Tu mascota ya eligió</p>
              <h2 className="mt-4 text-5xl uppercase leading-[0.9] sm:text-7xl">
                El próximo premio
                <br />
                <span className="text-lime-400">se pide aquí</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">
                Haz tu pedido en línea y coordinamos la entrega por WhatsApp. Si tienes dudas sobre
                porciones o ingredientes, escríbenos: te ayudamos a elegir.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/tienda" className="btn-lime">
                  Comprar snacks <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link href="/contacto" className="btn-outline-light">
                  Hablar con Carnalitos
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
