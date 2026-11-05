import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import AddToCart from "@/components/store/AddToCart";
import ProductCard from "@/components/store/ProductCard";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatCOP } from "@/lib/store/format";
import { PET_TYPE_LABELS } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const benefits = product.benefits.length > 0 ? product.benefits : [];
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <>
      <div className="border-b border-ink/[0.07] bg-cream-100">
        <div className="container-site flex flex-wrap items-center gap-2 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
          <Link href="/" className="transition hover:text-jungle-700">Inicio</Link>
          <Icon name="chevron-right" className="h-3 w-3" />
          <Link href="/tienda" className="transition hover:text-jungle-700">Tienda</Link>
          {product.categoryName && product.categorySlug && (
            <>
              <Icon name="chevron-right" className="h-3 w-3" />
              <Link href={`/tienda?category=${product.categorySlug}`} className="transition hover:text-jungle-700">
                {product.categoryName}
              </Link>
            </>
          )}
          <Icon name="chevron-right" className="h-3 w-3" />
          <span className="text-ink/70">{product.name}</span>
        </div>
      </div>

      <section className="py-10 sm:py-14">
        <div className="container-site grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-ink/[0.07] bg-white">
              <SmartImage
                src={product.image || "/images/brand/hero-snacks.svg"}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {discount > 0 && <span className="badge bg-lime-400 text-ink">-{discount}%</span>}
                {product.featured && <span className="badge bg-white/95 text-jungle-800">Favorito</span>}
                {product.stock <= 0 && <span className="badge bg-ink/80 text-white">Agotado</span>}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: "leaf" as const, label: "Natural" },
                { icon: "shield" as const, label: "Sin conservantes" },
                { icon: "package" as const, label: "Lote pequeño" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-ink/[0.07] bg-white px-3 py-4 text-center">
                  <Icon name={item.icon} className="h-4 w-4 text-jungle-600" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-ink/45">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-jungle-700">
              {product.categoryName ?? "Carnalitos"}
            </p>
            <h1 className="mt-2 text-4xl uppercase leading-[0.92] sm:text-5xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-7 text-ink/60">{product.shortDescription}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="chip !cursor-default">
                <Icon name="paw" className="h-3.5 w-3.5" /> {PET_TYPE_LABELS[product.petType]}
              </span>
              {product.weight && <span className="chip !cursor-default">{product.weight}</span>}
              {product.unit && <span className="chip !cursor-default">{product.unit}</span>}
              {product.sku && <span className="chip !cursor-default">SKU {product.sku}</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3 border-y border-ink/10 py-5">
              <span className="font-display text-5xl leading-none text-jungle-950">{formatCOP(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="pb-1 text-sm text-ink/35 line-through">{formatCOP(product.compareAtPrice)}</span>
              )}
              <span className={`badge ml-auto ${product.stock > 0 ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>
                {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
              </span>
            </div>

            {lowStock && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-sun-100/70 px-4 py-3 text-[11px] font-semibold text-yellow-900">
                <Icon name="alert" className="h-4 w-4" /> �altimas unidades: si te gusta, no lo dejes para después.
              </p>
            )}

            <div className="mt-6">
              <AddToCart product={product} withQuantity />
            </div>

            <div className="mt-6 rounded-2xl border border-ink/[0.07] bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="flex items-start gap-2 text-[11px] leading-5 text-ink/55">
                  <Icon name="truck" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" />
                  {settings.store.deliveryNote}
                </p>
                <p className="flex items-start gap-2 text-[11px] leading-5 text-ink/55">
                  <Icon name="bag" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" />
                  Recoge en {settings.store.pickupAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-cream-100 py-12 sm:py-16">
        <div className="container-site grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-3xl uppercase">Sobre este producto</h2>
            <p className="prose-store mt-4 whitespace-pre-line">{product.description || product.shortDescription}</p>
            {product.ingredients && (
              <div className="mt-6 rounded-2xl border border-ink/[0.07] bg-white p-5">
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-ink/40">
                  <Icon name="utensils" className="h-4 w-4 text-jungle-600" /> Ingredientes
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/65">{product.ingredients}</p>
              </div>
            )}
          </div>
          <aside className="rounded-2xl border border-ink/[0.07] bg-white p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Por qué le va a gustar</p>
            {benefits.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-[12px] leading-5 text-ink/60">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" strokeWidth={2.5} />
                    {benefit}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[12px] leading-6 text-ink/50">
                Elaborado con ingredientes reales y pensado para el consumo diario de tu mascota.
              </p>
            )}
            <div className="mt-5 border-t border-ink/10 pt-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Recomendación</p>
              <p className="mt-2 text-[11px] leading-5 text-ink/50">
                Ofrécelo como premio o complemento, siempre con agua fresca disponible. Consulta a tu veterinario si tu mascota tiene condiciones especiales.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">También le puede gustar</p>
                <h2 className="mt-2 text-3xl uppercase sm:text-4xl">Completa el pedido</h2>
              </div>
              <Link href="/tienda" className="link-arrow">
                Ver todo <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
