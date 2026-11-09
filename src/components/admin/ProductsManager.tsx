"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ImageField from "@/components/admin/ImageField";
import { formatCOP } from "@/lib/store/format";
import type { Category, Product } from "@/types";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  cost: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  unit: string;
  weight: string;
  petType: "perro" | "gato" | "ambos";
  benefits: string;
  ingredients: string;
  image: string;
  active: boolean;
  featured: boolean;
  sortOrder: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  price: "",
  cost: "0",
  compareAtPrice: "",
  stock: "0",
  sku: "",
  unit: "unidad",
  weight: "",
  petType: "ambos",
  benefits: "",
  ingredients: "",
  image: "",
  active: true,
  featured: false,
  sortOrder: "0",
};

function draftFromProduct(product: Product): Draft {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId ?? "",
    shortDescription: product.shortDescription,
    description: product.description,
    price: String(product.price),
    cost: String(product.cost ?? 0),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    sku: product.sku,
    unit: product.unit,
    weight: product.weight,
    petType: product.petType,
    benefits: product.benefits.join("\n"),
    ingredients: product.ingredients,
    image: product.image,
    active: product.active,
    featured: product.featured,
    sortOrder: String(product.sortOrder),
  };
}

function toPayload(draft: Draft) {
  return {
    name: draft.name,
    slug: draft.slug || undefined,
    categoryId: draft.categoryId || null,
    shortDescription: draft.shortDescription,
    description: draft.description,
    price: draft.price,
    cost: draft.cost === "" ? 0 : draft.cost,
    compareAtPrice: draft.compareAtPrice === "" ? null : draft.compareAtPrice,
    stock: draft.stock,
    sku: draft.sku,
    unit: draft.unit || "unidad",
    weight: draft.weight,
    petType: draft.petType,
    benefits: draft.benefits
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    ingredients: draft.ingredients,
    image: draft.image,
    active: draft.active,
    featured: draft.featured,
    sortOrder: draft.sortOrder,
  };
}

export default function ProductsManager({
  initialProducts,
  categories,
  startCreating = false,
  openProductId,
  initialStockFilter = false,
}: {
  initialProducts: Product[];
  categories: Category[];
  startCreating?: boolean;
  openProductId?: string;
  initialStockFilter?: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low">(
    initialStockFilter ? "low" : "all",
  );
  const [open, setOpen] = useState(startCreating);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!openProductId) return;
    const product = initialProducts.find((item) => item.id === openProductId);
    if (product) {
      setDraft(draftFromProduct(product));
      setOpen(true);
    }
  }, [initialProducts, openProductId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) return false;
      if (statusFilter === "active" && !product.active) return false;
      if (statusFilter === "inactive" && product.active) return false;
      if (statusFilter === "low" && (product.stock > 5 || !product.active)) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.shortDescription.toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryFilter, statusFilter]);

  const lowStockCount = products.filter((product) => product.active && product.stock <= 5).length;

  const draftPrice = Number(draft.price) || 0;
  const draftCost = Number(draft.cost) || 0;
  const draftProfit = draftPrice - draftCost;
  const draftMargin = draftPrice > 0 ? (draftProfit / draftPrice) * 100 : 0;

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setOpen(true);
    setMessage(null);
  }

  function openEdit(product: Product) {
    setDraft(draftFromProduct(product));
    setOpen(true);
    setMessage(null);
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setMessage(null);
    try {
      const isEdit = Boolean(draft.id);
      const response = await fetch(isEdit ? `/api/admin/products/${draft.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el producto.");
      const saved = data.product as Product;
      setProducts((previous) =>
        isEdit ? previous.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...previous],
      );
      setOpen(false);
      setMessage({ type: "ok", text: isEdit ? "Producto actualizado." : "Producto creado." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el producto." });
    } finally {
      setBusy(null);
    }
  }

  async function quickUpdate(product: Product, patch: Record<string, unknown>) {
    setBusy(product.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el producto.");
      const saved = data.product as Product;
      setProducts((previous) => previous.map((item) => (item.id === saved.id ? saved : item)));
      setMessage({ type: "ok", text: `${saved.name} actualizado.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar el producto." });
    } finally {
      setBusy(null);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Si tiene pedidos, quedará desactivado.`)) return;
    setBusy(product.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el producto.");
      if (data.result === "deleted") {
        setProducts((previous) => previous.filter((item) => item.id !== product.id));
      } else {
        setProducts((previous) =>
          previous.map((item) => (item.id === product.id ? { ...item, active: false } : item)),
        );
      }
      setMessage({ type: "ok", text: data.message || "Producto eliminado." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el producto." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Productos</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Crea productos, cambia precios y stock, y controla qué se muestra en la tienda.
          </p>
        </div>
        <button onClick={openCreate} className="btn-jungle btn-sm">
          <Icon name="plus" className="h-3.5 w-3.5" /> Nuevo producto
        </button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Total</p>
          <p className="mt-1 font-display text-2xl leading-none">{products.length}</p>
        </div>
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Activos</p>
          <p className="mt-1 font-display text-2xl leading-none">{products.filter((product) => product.active).length}</p>
        </div>
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Bajo stock</p>
          <p className="mt-1 font-display text-2xl leading-none text-yellow-700">{lowStockCount}</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-lg bg-cream-100 p-1">
            {[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
              { value: "low", label: `Bajo stock (${lowStockCount})` },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value as typeof statusFilter)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                  statusFilter === item.value ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="admin-input sm:w-48"
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className="relative sm:w-64">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto o SKU"
                className="admin-input pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Margen</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <ProductRow
                  key={`${product.id}-${product.price}-${product.cost ?? 0}-${product.stock}`}
                  product={product}
                  busy={busy === product.id}
                  onSave={(patch) => quickUpdate(product, patch)}
                  onToggle={(patch) => quickUpdate(product, patch)}
                  onEdit={() => openEdit(product)}
                  onDelete={() => removeProduct(product)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-ink/35">
                    No hay productos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[10px] text-ink/35">
        Puedes editar el precio y el stock directamente en la tabla. Los cambios se guardan con el botón ✓.
        <Link href="/tienda" target="_blank" className="ml-1 font-bold text-jungle-700 hover:underline">Ver tienda pública →</Link>
      </p>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button className="absolute inset-0 bg-ink/55" onClick={() => setOpen(false)} aria-label="Cerrar editor" />
          <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-cream shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">
                  {draft.id ? "Editar producto" : "Nuevo producto"}
                </p>
                <h2 className="mt-1 text-2xl uppercase leading-none">{draft.name || "Sin nombre"}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:text-ink" aria-label="Cerrar">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveProduct} className="space-y-5 p-5">
              <section className="admin-card">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Información básica</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="admin-label">Nombre *</label>
                    <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Slug (opcional)</label>
                    <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="se-genera-del-nombre" className="admin-input font-mono text-[11px]" />
                  </div>
                  <div>
                    <label className="admin-label">Categoría</label>
                    <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className="admin-input">
                      <option value="">Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Descripción corta</label>
                    <input maxLength={300} value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} className="admin-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Descripción completa</label>
                    <textarea rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="admin-textarea" />
                  </div>
                </div>
              </section>

              <section className="admin-card">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Precio e inventario</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="admin-label">Precio (COP) *</label>
                    <input required type="number" min={0} step={100} value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Costo (COP)</label>
                    <input type="number" min={0} step={100} value={draft.cost} onChange={(event) => setDraft({ ...draft, cost: event.target.value })} className="admin-input" />
                    <p className="mt-1 text-[10px] text-ink/40">Cuánto te cuesta producirlo o comprarlo.</p>
                  </div>
                  <div>
                    <label className="admin-label">Precio anterior</label>
                    <input type="number" min={0} step={100} value={draft.compareAtPrice} onChange={(event) => setDraft({ ...draft, compareAtPrice: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Stock *</label>
                    <input required type="number" min={0} step={1} value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">SKU</label>
                    <input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Unidad</label>
                    <input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} placeholder="bolsa, unidad, caja..." className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Peso / tamaño</label>
                    <input value={draft.weight} onChange={(event) => setDraft({ ...draft, weight: event.target.value })} placeholder="120 g" className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Mascota</label>
                    <select value={draft.petType} onChange={(event) => setDraft({ ...draft, petType: event.target.value as Draft["petType"] })} className="admin-input">
                      <option value="ambos">Perros y gatos</option>
                      <option value="perro">Perros</option>
                      <option value="gato">Gatos</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Orden</label>
                    <input type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })} className="admin-input" />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 rounded-xl bg-cream-100 p-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">Utilidad por unidad</p>
                    <p className={`mt-1 font-display text-xl leading-none ${draftProfit < 0 ? "text-red-600" : "text-jungle-800"}`}>
                      {formatCOP(draftProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">Margen de ganancia</p>
                    <p className={`mt-1 font-display text-xl leading-none ${draftMargin < 0 ? "text-red-600" : "text-jungle-800"}`}>
                      {draftMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">Ganancia total (stock)</p>
                    <p className="mt-1 font-display text-xl leading-none">
                      {formatCOP(draftProfit * (Number(draft.stock) || 0))}
                    </p>
                  </div>
                </div>
              </section>

              <section className="admin-card">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Detalles</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="admin-label">Beneficios (uno por línea)</label>
                    <textarea rows={4} value={draft.benefits} onChange={(event) => setDraft({ ...draft, benefits: event.target.value })} placeholder={"Alta proteína\nSin conservantes\nTextura crujiente"} className="admin-textarea" />
                  </div>
                  <div>
                    <label className="admin-label">Ingredientes</label>
                    <textarea rows={3} value={draft.ingredients} onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })} className="admin-textarea" />
                  </div>
                  <ImageField value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} label="Imagen del producto" />
                </div>
              </section>

              <section className="admin-card">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Visibilidad</p>
                <div className="mt-3 flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-ink/65">
                    <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="h-4 w-4 accent-jungle-700" />
                    Producto activo
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-ink/65">
                    <input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} className="h-4 w-4 accent-jungle-700" />
                    Destacado en inicio
                  </label>
                </div>
              </section>

              {message?.type === "error" && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message.text}</p>
              )}

              <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur">
                <button type="submit" disabled={busy === "save"} className="btn-jungle flex-1">
                  <Icon name="check" className="h-4 w-4" /> {busy === "save" ? "Guardando..." : draft.id ? "Guardar cambios" : "Crear producto"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancelar</button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  busy,
  onSave,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  onSave: (patch: { price: number; cost: number; stock: number }) => void;
  onToggle: (patch: { active?: boolean; featured?: boolean }) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [price, setPrice] = useState(String(product.price));
  const [cost, setCost] = useState(String(product.cost ?? 0));
  const [stock, setStock] = useState(String(product.stock));

  const priceNumber = Number(price) || 0;
  const costNumber = Number(cost) || 0;
  const profit = priceNumber - costNumber;
  const margin = priceNumber > 0 ? (profit / priceNumber) * 100 : 0;
  const dirty =
    priceNumber !== product.price ||
    costNumber !== (product.cost ?? 0) ||
    Number(stock) !== product.stock;

  return (
    <tr className={busy ? "opacity-50" : ""}>
      <td>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-200">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="tag" className="h-4 w-4 text-ink/30" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold">{product.name}</p>
            <p className="text-[10px] text-ink/40">{product.weight || product.unit} · {product.sku || "Sin SKU"}</p>
          </div>
        </div>
      </td>
      <td className="text-[11px] text-ink/55">{product.categoryName ?? "—"}</td>
      <td>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-ink/35">$</span>
          <input
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-24 rounded-md border border-ink/10 px-2 py-1.5 text-[11px] focus:border-jungle-500 focus:outline-none"
            aria-label={`Precio de ${product.name}`}
          />
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-ink/35">$</span>
          <input
            type="number"
            min={0}
            step={100}
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            className="w-24 rounded-md border border-ink/10 px-2 py-1.5 text-[11px] focus:border-jungle-500 focus:outline-none"
            aria-label={`Costo de ${product.name}`}
          />
        </div>
      </td>
      <td>
        <span
          className={`badge ${
            profit < 0
              ? "bg-red-100 text-red-700"
              : margin >= 40
                ? "bg-jungle-50 text-jungle-700"
                : "bg-sun-100 text-yellow-800"
          }`}
          title={`Utilidad por unidad: ${formatCOP(profit)}`}
        >
          {margin.toFixed(0)}%
        </span>
      </td>
      <td>
        <input
          type="number"
          min={0}
          step={1}
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          className={`w-16 rounded-md border px-2 py-1.5 text-[11px] focus:border-jungle-500 focus:outline-none ${product.stock <= 5 ? "border-sun-400 bg-sun-100/40" : "border-ink/10"}`}
          aria-label={`Stock de ${product.name}`}
        />
      </td>
      <td>
        <div className="flex flex-col items-start gap-1">
          <button
            onClick={() => onToggle({ active: !product.active })}
            className={`badge ${product.active ? "bg-jungle-50 text-jungle-700" : "bg-ink/5 text-ink/45"}`}
            title="Cambiar visibilidad"
          >
            {product.active ? "Activo" : "Inactivo"}
          </button>
          {product.featured && <span className="badge bg-lime-100 text-lime-700">Destacado</span>}
        </div>
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          {dirty && (
            <button
              onClick={() => onSave({ price: Number(price) || 0, cost: Math.max(0, Number(cost) || 0), stock: Math.max(0, Number(stock) || 0) })}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-jungle-700 text-white transition hover:bg-jungle-600"
              title="Guardar precio y stock"
            >
              <Icon name="check" className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-ink/50 transition hover:border-jungle-500 hover:text-jungle-700" title="Editar producto">
            <Icon name="edit" className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-ink/40 transition hover:border-red-300 hover:text-red-600" title="Eliminar producto">
            <Icon name="trash" className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
