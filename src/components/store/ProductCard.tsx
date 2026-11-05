import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import AddToCart from "@/components/store/AddToCart";
import { formatCOP, discountPercent } from "@/lib/store/format";
import type { Product } from "@/types";
import { PET_TYPE_LABELS } from "@/lib/utils/format";

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  return (
    <article className="product-card group">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream-200">
        <SmartImage
          src={product.image || "/images/brand/hero-snacks.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 && <span className="badge bg-lime-400 text-ink">-{discount}%</span>}
          {product.featured && <span className="badge bg-white/95 text-jungle-800">Favorito</span>}
          {product.stock <= 0 && <span className="badge bg-ink/80 text-white">Agotado</span>}
        </div>
        {product.petType !== "ambos" && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-jungle-800 backdrop-blur">
            {PET_TYPE_LABELS[product.petType]}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-jungle-700">
          {product.categoryName ?? "Carnalitos"}
        </p>
        <Link href={`/producto/${product.slug}`} className="mt-1.5">
          <h3 className="text-xl leading-none text-jungle-950 transition group-hover:text-jungle-700">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink/50">{product.shortDescription}</p>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-ink/[0.06] pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl text-jungle-950">{formatCOP(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[11px] text-ink/35 line-through">{formatCOP(product.compareAtPrice)}</span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-ink/40">
              {product.weight || product.unit} · {product.stock > 0 ? `${product.stock} disponibles` : "agotado"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <AddToCart product={product} className="flex-1" />
          <Link
            href={`/producto/${product.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-jungle-700 transition hover:border-jungle-600 hover:bg-jungle-50"
            aria-label={`Ver ${product.name}`}
          >
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
