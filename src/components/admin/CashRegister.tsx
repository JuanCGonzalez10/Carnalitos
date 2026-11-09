"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import SmartImage from "@/components/ui/SmartImage";
import { formatCOP } from "@/lib/store/format";
import type { PosTodaySummary } from "@/lib/data/orders";
import type { Product } from "@/types";

type PaymentMethod = "cash" | "nequi" | "bancolombia" | "card" | "transfer";

type SaleLine = { product: Product; quantity: number };

type LastSale = {
  code: string;
  total: number;
  received: number;
  change: number;
  itemCount: number;
};

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

function timeOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(date);
}

export default function CashRegister({
  initialProducts,
  initialSummary,
}: {
  initialProducts: Product[];
  initialSummary: PosTodaySummary;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of initialProducts) {
      if (product.categoryId && product.categoryName) {
        map.set(product.categoryId, product.categoryName);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [initialProducts]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (category !== "all" && product.categoryId !== category) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        (product.sku ?? "").toLowerCase().includes(term) ||
        (product.categoryName ?? "").toLowerCase().includes(term)
      );
    });
  }, [category, initialProducts, search]);

  const quantityInCart = useMemo(
    () => new Map(lines.map((line) => [line.product.id, line.quantity])),
    [lines],
  );

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const total = subtotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const receivedNumber = Number(received) || 0;
  const change = paymentMethod === "cash" ? Math.max(0, receivedNumber - total) : 0;
  const missing = paymentMethod === "cash" ? Math.max(0, total - receivedNumber) : 0;
  const canCharge =
    lines.length > 0 && !busy && (paymentMethod !== "cash" || receivedNumber + 0.001 >= total);

  const quickAmounts = useMemo(() => {
    if (total <= 0) return [];
    const roundTo = (step: number) => Math.ceil(total / step) * step;
    return Array.from(
      new Set([total, roundTo(5000), roundTo(10000), roundTo(20000), roundTo(50000), roundTo(100000)]),
    ).sort((a, b) => a - b);
  }, [total]);

  function addProduct(product: Product) {
    const current = quantityInCart.get(product.id) ?? 0;
    if (current >= product.stock) return;
    setLines((previous) => {
      const found = previous.find((line) => line.product.id === product.id);
      if (!found) return [...previous, { product, quantity: 1 }];
      return previous.map((line) =>
        line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
      );
    });
    setLastSale(null);
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((previous) =>
      previous
        .map((line) => {
          if (line.product.id !== productId) return line;
          const next = Math.max(0, Math.min(quantity, line.product.stock));
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
    setLastSale(null);
  }

  function clearSale() {
    setLines([]);
    setReceived("");
    setCustomerName("");
    setCustomerPhone("");
    setMessage(null);
  }

  async function registerSale() {
    if (!canCharge) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          paymentMethod,
          received: paymentMethod === "cash" ? receivedNumber : total,
          customerName,
          customerPhone,
          notes: "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo registrar la venta.");

      const order = data.order as { code: string };
      setLastSale({
        code: order.code,
        total,
        received: paymentMethod === "cash" ? receivedNumber : total,
        change,
        itemCount,
      });
      setLines([]);
      setReceived("");
      setCustomerName("");
      setCustomerPhone("");
      setMessage({ type: "ok", text: `Venta ${order.code} registrada correctamente.` });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar la venta.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Punto de venta</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Caja registradora</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Selecciona los productos, cobra en efectivo y entrega el cambio. Cada venta queda registrada en Pedidos y
            descuenta el inventario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-ink/[0.07] bg-white px-4 py-2.5 text-right">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Ventas de hoy</p>
            <p className="font-display text-xl leading-none">{formatCOP(initialSummary.total)}</p>
            <p className="mt-0.5 text-[10px] text-ink/40">
              {initialSummary.count} venta{initialSummary.count === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/admin/pedidos" className="btn-outline btn-sm">
            <Icon name="receipt" className="h-3.5 w-3.5" /> Ver pedidos
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] xl:items-start">
        <div className="admin-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="hide-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-cream-100 p-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                  category === "all" ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
                }`}
              >
                Todos ({initialProducts.length})
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                    category === item.id ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="relative lg:w-64">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto o código"
                className="admin-input pl-9"
              />
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="tag" className="mx-auto h-8 w-8 text-ink/20" />
              <p className="mt-3 text-sm text-ink/40">
                No hay productos con stock que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const inCart = quantityInCart.get(product.id) ?? 0;
                const soldOut = product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    disabled={soldOut || inCart >= product.stock}
                    className="group flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-white p-2.5 text-left transition hover:border-jungle-500/50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-100">
                      {product.image ? (
                        <SmartImage
                          src={product.image}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon name="tag" className="h-5 w-5 text-ink/25" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold leading-tight">{product.name}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-ink/40">
                        {product.categoryName ?? product.unit}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[12px] font-extrabold text-jungle-800">{formatCOP(product.price)}</span>
                        <span
                          className={`badge ${
                            product.stock <= 3 ? "bg-sun-100 text-yellow-800" : "bg-jungle-50 text-jungle-700"
                          }`}
                        >
                          {product.stock} disp.
                        </span>
                      </span>
                    </span>
                    {inCart > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-jungle-950 px-1.5 text-[10px] font-extrabold text-lime-400">
                        {inCart}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-24">
          <div className="admin-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Venta actual</p>
                <h2 className="mt-1 text-xl uppercase">Resumen</h2>
              </div>
              {lines.length > 0 && (
                <button type="button" onClick={clearSale} className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40 transition hover:text-red-600">
                  Vaciar
                </button>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="py-10 text-center">
                <Icon name="cart" className="mx-auto h-8 w-8 text-ink/20" />
                <p className="mt-3 text-sm text-ink/40">Toca un producto para agregarlo a la venta.</p>
              </div>
            ) : (
              <ul className="mt-3 max-h-72 divide-y divide-ink/[0.06] overflow-y-auto">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold">{line.product.name}</p>
                      <p className="text-[10px] text-ink/40">{formatCOP(line.product.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-lg border border-ink/10 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-ink/50 transition hover:bg-cream-100 hover:text-ink"
                        aria-label={`Quitar una unidad de ${line.product.name}`}
                      >
                        <Icon name="minus" className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-[12px] font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                        disabled={line.quantity >= line.product.stock}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-ink/50 transition hover:bg-cream-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Agregar una unidad de ${line.product.name}`}
                      >
                        <Icon name="plus" className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-20 text-right text-[12px] font-extrabold">
                      {formatCOP(line.product.price * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.product.id, 0)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink/30 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${line.product.name}`}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 space-y-1.5 border-t border-ink/[0.08] pt-3 text-[12px]">
              <div className="flex items-center justify-between text-ink/55">
                <span>Artículos</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-ink/55">
                <span>Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Total a pagar</span>
                <span className="font-display text-2xl leading-none">{formatCOP(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-ink/40">Método de pago</p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                      paymentMethod === method.value
                        ? "bg-jungle-950 text-lime-400"
                        : "border border-ink/10 text-ink/45 hover:border-jungle-500 hover:text-jungle-700"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="mt-4 rounded-xl bg-cream-100 p-3">
                <label htmlFor="cash-received" className="text-[9px] font-extrabold uppercase tracking-widest text-ink/45">
                  Efectivo recibido
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink/35">$</span>
                  <input
                    id="cash-received"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    value={received}
                    onChange={(event) => setReceived(event.target.value)}
                    placeholder="0"
                    className="admin-input !bg-white pl-7 text-right text-lg font-extrabold"
                  />
                </div>

                {quickAmounts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setReceived(String(amount))}
                        className={`rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                          receivedNumber === amount
                            ? "border-jungle-500 bg-white text-jungle-800"
                            : "border-ink/10 bg-white/60 text-ink/50 hover:border-jungle-500 hover:text-jungle-700"
                        }`}
                      >
                        {formatCOP(amount)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-end justify-between gap-3 rounded-lg bg-white px-3 py-2.5">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">Cambio</p>
                    <p className={`font-display text-2xl leading-none ${missing > 0 ? "text-red-600" : "text-jungle-800"}`}>
                      {formatCOP(change)}
                    </p>
                  </div>
                  {missing > 0 && total > 0 && (
                    <p className="text-right text-[10px] font-semibold text-red-600">
                      Faltan {formatCOP(missing)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] font-extrabold uppercase tracking-widest text-ink/40 hover:text-ink/70">
                Datos del cliente (opcional)
              </summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nombre"
                  className="admin-input"
                />
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Teléfono"
                  className="admin-input"
                />
              </div>
            </details>

            <button
              type="button"
              onClick={registerSale}
              disabled={!canCharge}
              className="btn-dark mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="money" className="h-4 w-4" />
              {busy ? "Registrando…" : "Registrar venta"}
            </button>
          </div>

          {lastSale && (
            <div className="rounded-2xl border border-jungle-600/30 bg-jungle-950 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-lime-400">Venta registrada</p>
                <span className="text-[10px] text-white/50">{lastSale.itemCount} artículo{lastSale.itemCount === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <p className="font-mono text-lg font-bold">{lastSale.code}</p>
                <p className="text-[12px] text-white/60">Total {formatCOP(lastSale.total)}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.06] p-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/40">Recibido</p>
                  <p className="mt-1 font-display text-xl leading-none">{formatCOP(lastSale.received)}</p>
                </div>
                <div className="rounded-xl bg-lime-400 p-3 text-ink">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/50">Cambio</p>
                  <p className="mt-1 font-display text-xl leading-none">{formatCOP(lastSale.change)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setLastSale(null)} className="btn-outline-light btn-sm flex-1 justify-center">
                  Nueva venta
                </button>
                <Link href="/admin/pedidos" className="btn-outline-light btn-sm flex-1 justify-center">
                  Ver pedidos
                </Link>
              </div>
            </div>
          )}

          <div className="admin-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Hoy</p>
                <h2 className="mt-1 text-lg uppercase">Últimas ventas</h2>
              </div>
              <span className="badge bg-jungle-50 text-jungle-700">{initialSummary.count}</span>
            </div>
            <div className="mt-2 divide-y divide-ink/[0.06]">
              {initialSummary.recent.length === 0 && (
                <p className="py-6 text-center text-[12px] text-ink/35">Aún no hay ventas de caja hoy.</p>
              )}
              {initialSummary.recent.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-bold">{order.code}</p>
                    <p className="text-[10px] text-ink/40">
                      {timeOnly(order.createdAt)} · {order.itemsCount ?? 0} art.
                    </p>
                  </div>
                  <span className="text-[12px] font-extrabold">{formatCOP(order.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
