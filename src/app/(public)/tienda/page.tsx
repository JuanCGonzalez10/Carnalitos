import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import Icon from "@/components/ui/Icon";
import ProductCard from "@/components/store/ProductCard";
import ProductFilters from "@/components/store/ProductFilters";
import { listCategories, listProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/store/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tienda de snacks y comida para mascotas",
  description:
    "Compra snacks naturales, comida saludable y premios para perros y gatos. Productos hechos en Colombia con ingredientes reales.",
};

const PET_FILTERS = [
  { value: "perro", label: "Perros" },
  { value: "gato", label: "Gatos" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; pet?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "";
  const query = params.q ?? "";
  const sort = params.sort ?? "featured";
  const pet = params.pet ?? "";

  const [categories, allProducts, settings] = await Promise.all([
    listCategories(),
    listProducts({ categorySlug: category || undefined, search: query, sort }),
    getSettings(),
  ]);

  const products = pet ? allProducts.filter((product) => product.petType === pet || product.petType === "ambos") : allProducts;
  const categoryName = categories.find((item) => item.slug === category)?.name;

  return (
    <>
      <PageHero
        eyebrow="Tienda Carnalitos"
        title={categoryName ? categoryName : "Snacks que enamoran"}
        description={
          categoryName
            ? "Selección de productos naturales pensados para su bienestar. Elige, agrega al carrito y recibe en casa."
            : "Snacks, comida y premios elaborados con ingredientes reales. Para perros y gatos que se merecen lo mejor."
        }
        image="/images/brand/page-hero.svg"
      >
        <div className="mt-7 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2">
            <Icon name="truck" className="h-3.5 w-3.5 text-lime-400" /> Envío gratis desde{" "}
            {formatCOP(settings.store.freeShippingThreshold)}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2">
            <Icon name="leaf" className="h-3.5 w-3.5 text-lime-400" /> Ingredientes naturales
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2">
            <Icon name="shield" className="h-3.5 w-3.5 text-lime-400" /> Pago contraentrega
          </span>
        </div>
      </PageHero>

      <section className="py-12 sm:py-16">
        <div className="container-site">
          <ProductFilters categories={categories} currentCategory={category} query={query} sort={sort} total={products.length} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link href={`/tienda${category ? `?category=${category}` : ""}`} className={`chip ${!pet ? "chip-active" : ""}`}>
              Todas las mascotas
            </Link>
            {PET_FILTERS.map((item) => {
              const search = new URLSearchParams();
              if (category) search.set("category", category);
              if (query) search.set("q", query);
              if (sort) search.set("sort", sort);
              search.set("pet", item.value);
              return (
                <Link
                  key={item.value}
                  href={`/tienda?${search.toString()}`}
                  className={`chip ${pet === item.value ? "chip-active" : ""}`}
                >
                  <Icon name={item.value === "gato" ? "paw" : "bone"} className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {products.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-jungle-700">
                <Icon name="search" className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-3xl uppercase">No encontramos productos</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">
                Prueba con otra palabra, cambia de categoría o revisa todos los productos disponibles.
              </p>
              <Link href="/tienda" className="btn-lime mt-6">
                Ver toda la tienda <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="mt-12 grid gap-4 rounded-3xl border border-ink/[0.07] bg-white p-6 sm:grid-cols-3">
            {[
              { icon: "truck" as const, title: "Envíos en Medellín", text: settings.store.deliveryNote },
              { icon: "shield" as const, title: "Compra segura", text: "Pedido confirmado por WhatsApp o correo antes de despachar." },
              { icon: "heart" as const, title: "Asesoría real", text: "Te ayudamos a elegir según edad, tamaño y necesidades." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jungle-50 text-jungle-700">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink/45">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
