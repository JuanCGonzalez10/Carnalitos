import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { Category } from "@/types";

function buildHref(params: { category?: string; q?: string; sort?: string }): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  const query = search.toString();
  return query ? `/tienda?${query}` : "/tienda";
}

export default function ProductFilters({
  categories,
  currentCategory,
  query,
  sort,
  total,
}: {
  categories: Category[];
  currentCategory: string;
  query: string;
  sort: string;
  total: number;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Link href={buildHref({ q: query, sort })} className={`chip ${!currentCategory ? "chip-active" : ""}`}>
          <Icon name="grid" className="h-3.5 w-3.5" /> Todos
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={buildHref({ category: category.slug, q: query, sort })}
            className={`chip ${currentCategory === category.slug ? "chip-active" : ""}`}
          >
            {category.name}
            {typeof category.productCount === "number" && <span className="opacity-60">({category.productCount})</span>}
          </Link>
        ))}
      </div>

      <form action="/tienda" method="get" className="flex flex-col gap-3 rounded-2xl border border-ink/[0.08] bg-white p-3 sm:flex-row sm:items-center">
        {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar snack, ingrediente o nombre..."
            className="w-full rounded-xl border border-transparent bg-cream-100 py-2.5 pl-10 pr-3 text-sm placeholder:text-ink/35 focus:border-jungle-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort || "featured"}
            className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-[12px] font-semibold text-ink/65 focus:border-jungle-500 focus:outline-none"
            aria-label="Ordenar productos"
          >
            <option value="featured">Destacados</option>
            <option value="newest">Novedades</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
          <button type="submit" className="btn-jungle btn-sm">
            <Icon name="filter" className="h-3.5 w-3.5" /> Filtrar
          </button>
        </div>
      </form>

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
        {total} {total === 1 ? "producto" : "productos"}
        {query ? ` para “${query}”` : ""}
      </p>
    </div>
  );
}
