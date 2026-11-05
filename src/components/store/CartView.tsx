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
  {
    value: "cash",
    label: "Efectivo contraentrega",
    hint: "Pagas al recibir tu pedido en Medellín",
  },
  {
    value: "nequi",
    label: "Nequi",
    hint: "Te enviamos el QR o número para transferir",
  },
  {
    value: "transfer",
    label: "Transferencia Bancolombia",
    hint: "Cuenta de ahorros Bancolombia",
  },
] as const;

export default function CartView({ store }: { store: StoreSettings }) {
  const router = useRouter();
  const { items, ready, setQuantity, remove, clear } = useCart();
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
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const totals = cartTotals(items, store, deliveryMethod);

  async function handleConfirmOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      setError("Por favor escribe tu nombre completo.");
      return;
    }

    if (!form.customerEmail.trim() || !form.customerEmail.includes("@")) {
      setError("Por favor escribe un correo electrónico válido.");
      return;
    }

    if (!form.customerPhone.trim() || form.customerPhone.trim().length < 7) {
      setError("Por favor escribe un número de teléfono o WhatsApp válido.");
      return;
    }

    if (deliveryMethod === "delivery" && (!form.address.trim() || form.address.trim().length < 5)) {
      setError("Por favor ingresa la dirección completa de entrega en Medellín.");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar las condiciones de compra para continuar.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          deliveryMethod,
          address: deliveryMethod === "pickup" ? "Recogida en tienda" : form.address.trim(),
          city: "Medellín",
          notes: form.notes.trim(),
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          acceptTerms: true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "No pudimos registrar tu pedido. Intenta nuevamente.");
      }

      // Vaciar carrito
      clear();

      // Abrir WhatsApp con el pedido listo para enviar a la tienda (+57 310 833 8636)
      if (data.order?.whatsappUrl) {
        try {
          window.open(data.order.whatsappUrl, "_blank");
        } catch {
          // Si el navegador bloquea la ventana emergente, la página de confirmación tiene el botón directo
        }
      }

      // Redirigir a la página de confirmación del pedido
      router.push(`/pedido/${data.order.code}?nuevo=1`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Ocurrió un error inesperado al registrar el pedido.",
      );
      setSending(false);
    }
  }

  if (!ready) {
    return <div className="h-72 animate-pulse rounded-3xl bg-cream-200" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-jungle-700">
          <Icon name="cart" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-3xl uppercase">Tu carrito está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">
          Explora nuestros snacks naturales y premios para consentir a tu mascota en Medellín. Envío gratis desde{" "}
          {formatCOP(store.freeShippingThreshold)}.
        </p>
        <Link href="/tienda" className="btn-lime mt-6">
          Ir a la tienda <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirmOrder} className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="space-y-6">
        {/* Lista de productos */}
        <section className="rounded-3xl border border-ink/[0.07] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/[0.08] pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-jungle-950">
              Productos en el carrito ({items.length})
            </h2>
            <Link href="/tienda" className="link-arrow text-xs">
              <Icon name="plus" className="h-3.5 w-3.5" /> Agregar más
            </Link>
          </div>

          <div className="mt-4 divide-y divide-ink/[0.07]">
            {items.map((item) => (
              <article
                key={item.productId}
                className="flex flex-col gap-4 py-4 first:pt-2 last:pb-0 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/producto/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-200"
                >
                  <SmartImage src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="font-bold leading-snug text-jungle-950 transition hover:text-jungle-700"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {formatCOP(item.price)} · {item.unit}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-ink/35 transition hover:text-red-600"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" /> Quitar
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-full border border-ink/10 bg-cream-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink/60 transition hover:bg-white"
                      aria-label="Quitar una unidad"
                    >
                      <Icon name="minus" className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink/60 transition hover:bg-white disabled:opacity-30"
                      aria-label="Agregar una unidad"
                    >
                      <Icon name="plus" className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-display text-lg font-bold text-jungle-950">
                    {formatCOP(item.price * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Formulario de entrega y dirección en Medellín */}
        <section className="rounded-3xl border border-ink/[0.07] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400 text-ink">
              <Icon name="pin" className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold uppercase tracking-wide text-jungle-950">
              Datos para la entrega en Medellín
            </h2>
          </div>

          <div className="mt-3 rounded-2xl bg-jungle-50 p-3.5 text-xs text-jungle-900 border border-jungle-200">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="truck" className="h-4 w-4 text-jungle-700" />
              Envíos exclusivos en Medellín y área metropolitana (24 a 48 h).
            </p>
          </div>

          {/* Método de entrega */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              className={`rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "delivery"
                  ? "border-jungle-700 bg-jungle-50 text-jungle-900 shadow-sm"
                  : "border-ink/10 text-ink/50 hover:border-ink/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon name="truck" className="h-5 w-5 text-jungle-700" />
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    deliveryMethod === "delivery" ? "border-jungle-700 bg-jungle-700" : "border-ink/20"
                  }`}
                />
              </div>
              <p className="mt-2 text-sm font-bold">Domicilio en Medellín</p>
              <p className="mt-0.5 text-[11px] text-ink/45">
                {totals.shipping === 0
                  ? "¡Envío gratis!"
                  : `${formatCOP(store.shippingCost)} · gratis desde ${formatCOP(store.freeShippingThreshold)}`}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              className={`rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "pickup"
                  ? "border-jungle-700 bg-jungle-50 text-jungle-900 shadow-sm"
                  : "border-ink/10 text-ink/50 hover:border-ink/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon name="bag" className="h-5 w-5 text-jungle-700" />
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    deliveryMethod === "pickup" ? "border-jungle-700 bg-jungle-700" : "border-ink/20"
                  }`}
                />
              </div>
              <p className="mt-2 text-sm font-bold">Recoger en tienda</p>
              <p className="mt-0.5 text-[11px] text-ink/45">Sin costo de envío</p>
            </button>
          </div>

          {/* Campos de contacto */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="cart-name" className="field-label">
                Nombre y apellido completo *
              </label>
              <input
                id="cart-name"
                required
                minLength={2}
                maxLength={120}
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="field"
                placeholder="Ej. Juan Camilo Pérez"
              />
            </div>

            <div>
              <label htmlFor="cart-phone" className="field-label">
                Teléfono / WhatsApp *
              </label>
              <input
                id="cart-phone"
                type="tel"
                required
                minLength={7}
                maxLength={25}
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="field"
                placeholder="Ej. 310 833 8636"
              />
            </div>

            <div>
              <label htmlFor="cart-email" className="field-label">
                Correo electrónico *
              </label>
              <input
                id="cart-email"
                type="email"
                required
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="field"
                placeholder="Ej. juan@ejemplo.com"
              />
            </div>

            {/* Dirección de entrega en Medellín */}
            {deliveryMethod === "delivery" ? (
              <>
                <div className="sm:col-span-2">
                  <label htmlFor="cart-address" className="field-label">
                    Dirección de entrega en Medellín *
                  </label>
                  <input
                    id="cart-address"
                    required
                    maxLength={250}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="field border-jungle-500/40 bg-cream-50/50"
                    placeholder="Ej. Carrera 43A # 1Sur-220, El Poblado, Torre 2 Apto 804"
                  />
                  <p className="mt-1 text-[11px] text-ink/45">
                    Incluye barrio, calle o carrera, número, torre y apartamento si aplica.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cart-notes" className="field-label">
                    Notas adicionales para el repartidor (opcional)
                  </label>
                  <input
                    id="cart-notes"
                    maxLength={300}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="field"
                    placeholder="Ej. Dejar en portería, timbre no funciona, perro bravo..."
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 rounded-2xl bg-cream-100 p-4 text-xs leading-5 text-ink/65">
                <p className="font-bold text-jungle-800 flex items-center gap-2">
                  <Icon name="pin" className="h-4 w-4" /> {store.pickupAddress}
                </p>
                <p className="mt-1 text-[11px] text-ink/50">{store.pickupSchedule}</p>
                <p className="mt-2 text-ink/50">
                  Te avisaremos por WhatsApp cuando tu pedido esté listo para recoger.
                </p>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="mt-6 border-t border-ink/[0.08] pt-5">
            <label className="field-label mb-2 block">
              Selecciona el método de pago *
            </label>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${
                    paymentMethod === option.value
                      ? "border-jungle-700 bg-jungle-50 shadow-sm"
                      : "border-ink/10 hover:border-ink/25"
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
                    <span className="block text-sm font-bold text-jungle-950">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-ink/50">{option.hint}</span>
                  </span>
                  <Icon name="money" className="h-4 w-4 text-jungle-600/50" />
                </label>
              ))}
            </div>
          </div>

          {/* Términos */}
          <label className="mt-4 flex items-start gap-2.5 text-xs text-ink/60">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-jungle-700"
            />
            <span>
              Acepto las condiciones de compra y la entrega exclusiva en Medellín. Confirmaremos
              tu pedido por WhatsApp antes del despacho.
            </span>
          </label>
        </section>
      </div>

      {/* Resumen lateral y botón de compra */}
      <aside className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6 shadow-sm lg:sticky lg:top-28">
        <h2 className="text-xl font-bold uppercase text-jungle-950">Resumen del pedido</h2>

        <div className="mt-5 space-y-2.5 border-t border-ink/[0.08] pt-4 text-sm">
          <div className="flex items-center justify-between text-ink/60">
            <span>Subtotal ({items.reduce((s, it) => s + it.quantity, 0)} productos)</span>
            <span className="font-semibold text-ink">{formatCOP(totals.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-ink/60">
            <span>{deliveryMethod === "pickup" ? "Recogida" : "Domicilio en Medellín"}</span>
            <span className="font-semibold text-ink">
              {totals.shipping === 0 ? (
                <span className="text-jungle-700 font-bold">Gratis</span>
              ) : (
                formatCOP(totals.shipping)
              )}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-ink/[0.08] pt-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-ink/45">
              Total a pagar
            </span>
            <span className="font-display text-3xl font-extrabold text-jungle-950">
              {formatCOP(totals.total)}
            </span>
          </div>
        </div>

        {deliveryMethod === "delivery" && totals.freeShippingRemaining > 0 && (
          <div className="mt-4 rounded-xl bg-cream-100 p-3">
            <p className="text-[11px] leading-5 text-ink/55">
              Agrega <strong className="text-jungle-800">{formatCOP(totals.freeShippingRemaining)}</strong> más para
              obtener <strong>envío gratis en Medellín</strong>.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-lime-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (totals.subtotal / Math.max(1, store.freeShippingThreshold)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="btn-lime mt-5 w-full justify-center text-sm font-bold shadow-lg"
        >
          {sending ? (
            "Registrando pedido..."
          ) : (
            <>
              <Icon name="whatsapp" className="h-4 w-4" /> Confirmar pedido por WhatsApp
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-ink/45">
          Al confirmar, se registrará tu compra, te enviaremos confirmación al correo y se abrirá
          WhatsApp con los datos listos para despachar.
        </p>

        <ul className="mt-5 space-y-2 border-t border-ink/[0.08] pt-4 text-[11px] text-ink/50">
          <li className="flex items-center gap-2">
            <Icon name="shield" className="h-4 w-4 text-jungle-600" />
            Pago contraentrega en Medellín disponible
          </li>
          <li className="flex items-center gap-2">
            <Icon name="truck" className="h-4 w-4 text-jungle-600" />
            Envíos en Medellín en 24 a 48 horas
          </li>
          <li className="flex items-center gap-2">
            <Icon name="leaf" className="h-4 w-4 text-jungle-600" />
            Ingredientes naturales sin conservantes
          </li>
        </ul>
      </aside>
    </form>
  );
}
