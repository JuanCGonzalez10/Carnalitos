"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { useCart } from "@/components/store/CartProvider";
import { cartTotals, formatCOP } from "@/lib/store/format";
import type { StoreSettings } from "@/types";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Efectivo contraentrega", hint: "Disponible en Medellín" },
  { value: "nequi", label: "Nequi", hint: "Te enviamos el número al confirmar" },
  { value: "transfer", label: "Transferencia Bancolombia", hint: "Te enviamos los datos al confirmar" },
] as const;

export default function CheckoutForm({ store }: { store: StoreSettings }) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "Medellín",
    notes: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const totals = cartTotals(items, store, deliveryMethod);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar las condiciones de compra.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryMethod,
          paymentMethod,
          address: deliveryMethod === "pickup" ? "" : form.address,
          city: deliveryMethod === "pickup" ? form.city : form.city,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          acceptTerms: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No pudimos registrar tu pedido.");
      clear();
      if (data.order?.whatsappUrl) {
        try {
          window.open(data.order.whatsappUrl, "_blank");
        } catch {
          // Si el navegador bloquea la ventana emergente, la página de confirmación tiene el botón directo
        }
      }
      router.push(`/pedido/${data.order.code}?nuevo=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos registrar tu pedido.");
      setSending(false);
    }
  }

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-3xl bg-cream-200" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
        <Icon name="cart" className="mx-auto h-10 w-10 text-ink/20" />
        <h2 className="mt-4 text-3xl uppercase">No hay productos para pagar</h2>
        <p className="mt-2 text-sm text-ink/50">Agrega snacks al carrito antes de finalizar la compra.</p>
        <Link href="/tienda" className="btn-lime mt-6">
          Ir a la tienda <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="space-y-5">
        <section className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6">
          <h2 className="text-2xl uppercase">Datos de contacto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="checkout-name" className="field-label">Nombre completo *</label>
              <input
                id="checkout-name"
                required
                minLength={2}
                maxLength={120}
                value={form.customerName}
                onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                className="field"
                placeholder="Tu nombre y apellido"
              />
            </div>
            <div>
              <label htmlFor="checkout-email" className="field-label">Correo *</label>
              <input
                id="checkout-email"
                type="email"
                required
                value={form.customerEmail}
                onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
                className="field"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <div>
              <label htmlFor="checkout-phone" className="field-label">Teléfono / WhatsApp *</label>
              <input
                id="checkout-phone"
                type="tel"
                required
                minLength={7}
                maxLength={30}
                value={form.customerPhone}
                onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
                className="field"
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6">
          <h2 className="text-2xl uppercase">Entrega</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              className={`rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "delivery"
                  ? "border-jungle-700 bg-jungle-50"
                  : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon name="truck" className="h-5 w-5 text-jungle-700" />
                <span className={`h-3 w-3 rounded-full border-2 ${deliveryMethod === "delivery" ? "border-jungle-700 bg-jungle-700" : "border-ink/20"}`} />
              </div>
              <p className="mt-2 text-sm font-bold">Envío a domicilio</p>
              <p className="mt-0.5 text-[11px] text-ink/45">
                {totals.shipping === 0 ? "Gratis en este pedido" : `${formatCOP(store.shippingCost)} · gratis desde ${formatCOP(store.freeShippingThreshold)}`}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              className={`rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "pickup"
                  ? "border-jungle-700 bg-jungle-50"
                  : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon name="bag" className="h-5 w-5 text-jungle-700" />
                <span className={`h-3 w-3 rounded-full border-2 ${deliveryMethod === "pickup" ? "border-jungle-700 bg-jungle-700" : "border-ink/20"}`} />
              </div>
              <p className="mt-2 text-sm font-bold">Recoger en tienda</p>
              <p className="mt-0.5 text-[11px] text-ink/45">Sin costo de envío</p>
            </button>
          </div>

          {deliveryMethod === "delivery" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="checkout-address" className="field-label">Dirección *</label>
                <input
                  id="checkout-address"
                  required
                  maxLength={300}
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  className="field"
                  placeholder="Calle, carrera, número, barrio y referencias"
                />
              </div>
              <div>
                <label htmlFor="checkout-city" className="field-label">Ciudad *</label>
                <input
                  id="checkout-city"
                  required
                  maxLength={100}
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  className="field"
                  placeholder="Medellín"
                />
              </div>
              <div>
                <label htmlFor="checkout-notes" className="field-label">Notas para la entrega</label>
                <input
                  id="checkout-notes"
                  maxLength={300}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  className="field"
                  placeholder="Torre, apartamento, indicaciones..."
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm leading-6 text-ink/60">
              <p className="flex items-center gap-2 font-bold text-jungle-800">
                <Icon name="pin" className="h-4 w-4" /> {store.pickupAddress}
              </p>
              <p className="mt-1 flex items-center gap-2 text-[12px]">
                <Icon name="clock" className="h-4 w-4" /> {store.pickupSchedule}
              </p>
              <p className="mt-2 text-[11px] text-ink/45">Te avisaremos por WhatsApp cuando tu pedido esté listo.</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6">
          <h2 className="text-2xl uppercase">Pago</h2>
          <p className="mt-1 text-[11px] text-ink/45">No realizamos cobros automáticos. Confirmamos el pago contigo.</p>
          <div className="mt-4 space-y-2">
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${
                  paymentMethod === option.value ? "border-jungle-700 bg-jungle-50" : "border-ink/10 hover:border-ink/25"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="h-4 w-4 accent-jungle-700"
                />
                <span className="flex-1">
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="block text-[11px] text-ink/45">{option.hint}</span>
                </span>
                <Icon name="money" className="h-4 w-4 text-ink/30" />
              </label>
            ))}
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-[11px] leading-5 text-ink/55">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-jungle-700"
            />
            <span>
              Acepto las condiciones de compra y el tratamiento de mis datos para gestionar el pedido. {store.terms}
            </span>
          </label>
        </section>
      </div>

      <aside className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="text-2xl uppercase">Tu pedido</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                <SmartImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold">{item.name}</p>
                <p className="text-[10px] text-ink/40">
                  {item.quantity} × {formatCOP(item.price)}
                </p>
              </div>
              <p className="text-[12px] font-bold">{formatCOP(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2.5 border-t border-ink/[0.08] pt-4 text-sm">
          <div className="flex items-center justify-between text-ink/60">
            <span>Subtotal</span>
            <span className="font-semibold text-ink">{formatCOP(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-ink/60">
            <span>Envío</span>
            <span className="font-semibold text-ink">
              {totals.shipping === 0 ? "Gratis" : formatCOP(totals.shipping)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-ink/[0.08] pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink/45">Total</span>
            <span className="font-display text-3xl text-jungle-950">{formatCOP(totals.total)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</p>
        )}

        <button type="submit" disabled={sending} className="btn-lime mt-5 w-full">
          {sending ? "Registrando pedido..." : "Confirmar pedido"} <Icon name="arrow" className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-[10px] leading-5 text-ink/40">
          Al confirmar, generamos un código de pedido para que puedas seguirlo.
        </p>
        <Link href="/carrito" className="mt-3 flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-ink/40 transition hover:text-jungle-700">
          <Icon name="chevron-left" className="h-3.5 w-3.5" /> Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
