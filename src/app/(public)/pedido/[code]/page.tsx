import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getOrderByCode } from "@/lib/data/orders";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/store/format";
import { buildOrderWhatsAppUrl } from "@/lib/order-notifications";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle del pedido",
  robots: { index: false, follow: false },
};

const STEPS = ["pending", "confirmed", "preparing", "shipped", "delivered"] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const [{ code }, query, settings] = await Promise.all([params, searchParams, getSettings()]);
  const order = await getOrderByCode(decodeURIComponent(code));
  if (!order) notFound();

  const isNew = query.nuevo === "1";
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";

  const whatsappUrl = buildOrderWhatsAppUrl(settings.business.whatsapp, {
    code: order.code,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    deliveryMethod: order.deliveryMethod as "delivery" | "pickup",
    address: order.address,
    city: order.city || "Medellín",
    notes: order.notes,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    items: (order.items || []).map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
  });

  return (
    <section className="py-10 sm:py-14">
      <div className="container-site">
        {isNew && (
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border-2 border-jungle-600/30 bg-jungle-50 p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-jungle-700 text-white shadow">
                <Icon name="whatsapp" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-2xl uppercase leading-none text-jungle-950">¡Pedido registrado con éxito!</p>
                <p className="mt-1.5 text-[13px] leading-5 text-jungle-900/80">
                  Código: <strong className="text-jungle-950">{order.code}</strong>. Haz clic abajo para enviar o confirmar el pedido por WhatsApp directamente con la tienda.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lime flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold shadow hover:scale-[1.02] transition"
              >
                <Icon name="whatsapp" className="h-4 w-4" /> Enviar por WhatsApp
              </a>
              <Link href="/tienda" className="btn-outline btn-sm">
                Seguir comprando
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Pedido</p>
            <h1 className="mt-2 text-4xl uppercase sm:text-5xl">{order.code}</h1>
            <p className="mt-2 text-[12px] text-ink/45">
              Creado el {formatDateTime(order.createdAt)} · {formatCOP(order.total)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} type="payment" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-5">
            <section className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl uppercase">Estado del pedido</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/35">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {cancelled ? (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  <p className="flex items-center gap-2 font-bold">
                    <Icon name="alert" className="h-4 w-4" /> Este pedido fue cancelado.
                  </p>
                  <p className="mt-1 text-[11px] leading-5">
                    Si tienes dudas o quieres retomarlo, escríbenos por WhatsApp con el código {order.code}.
                  </p>
                </div>
              ) : (
                <ol className="mt-6 grid gap-2 sm:grid-cols-5">
                  {STEPS.map((step, index) => {
                    const done = index <= currentStep;
                    return (
                      <li key={step} className="relative flex items-center gap-2 sm:flex-col sm:gap-2 sm:text-center">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                            done ? "bg-jungle-700 text-white" : "bg-cream-200 text-ink/35"
                          }`}
                        >
                          {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest ${done ? "text-jungle-800" : "text-ink/35"}`}>
                          {ORDER_STATUS_LABELS[step]}
                        </span>
                        {index < STEPS.length - 1 && (
                          <span
                            className={`absolute left-8 top-4 hidden h-px w-[calc(100%-1.5rem)] sm:block ${
                              index < currentStep ? "bg-jungle-600" : "bg-ink/10"
                            }`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="rounded-3xl border border-ink/[0.08] bg-white p-5 sm:p-6">
              <h2 className="text-2xl uppercase">Productos</h2>
              <div className="mt-4 divide-y divide-ink/[0.06]">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                      <SmartImage src={item.image || "/images/brand/hero-snacks.svg"} alt={item.productName} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold">{item.productName}</p>
                      <p className="mt-0.5 text-[10px] text-ink/40">
                        {item.quantity} � {formatCOP(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-[13px] font-bold">{formatCOP(item.total)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
                <div className="flex justify-between text-ink/55">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">{formatCOP(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink/55">
                  <span>Envío</span>
                  <span className="font-semibold text-ink">{order.shipping === 0 ? "Gratis" : formatCOP(order.shipping)}</span>
                </div>
                <div className="flex items-end justify-between border-t border-ink/10 pt-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/45">Total</span>
                  <span className="font-display text-3xl leading-none">{formatCOP(order.total)}</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-ink/[0.08] bg-white p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/38">Entrega</p>
              <p className="mt-2 flex items-center gap-2 font-display text-xl uppercase">
                <Icon name="truck" className="h-4 w-4 text-jungle-700" />
                {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
              </p>
              <div className="mt-3 space-y-1.5 text-[12px] leading-5 text-ink/55">
                {order.deliveryMethod === "pickup" ? (
                  <>
                    <p>{settings.store.pickupAddress}</p>
                    <p className="text-[11px] text-ink/40">{settings.store.pickupSchedule}</p>
                  </>
                ) : (
                  <>
                    <p>{order.address}</p>
                    <p>{order.city}</p>
                    {order.notes && <p className="text-[11px] text-ink/40">Notas: {order.notes}</p>}
                  </>
                )}
              </div>
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/38">Pago</p>
                <p className="mt-1 text-[12px] font-semibold text-ink/70">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </p>
                <p className="mt-1 text-[11px] text-ink/40">
                  {order.paymentStatus === "paid"
                    ? "Pago confirmado. ¡Gracias!"
                    : "Aún no registramos el pago. Coordinaremos contigo por WhatsApp."}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-ink/[0.08] bg-white p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/38">Datos de contacto</p>
              <div className="mt-3 space-y-2 text-[12px] text-ink/60">
                <p className="font-bold text-ink">{order.customerName}</p>
                <p className="flex items-center gap-2"><Icon name="mail" className="h-3.5 w-3.5 text-jungle-600" /> {order.customerEmail}</p>
                <p className="flex items-center gap-2"><Icon name="phone" className="h-3.5 w-3.5 text-jungle-600" /> {order.customerPhone}</p>
              </div>
            </section>

            <div className="rounded-3xl bg-jungle-950 p-5 text-white">
              <p className="font-display text-2xl uppercase leading-none">¿Atención o Dudas?</p>
              <p className="mt-2 text-[11px] leading-5 text-white/55">
                Escríbenos directamente a nuestro WhatsApp con el código <strong className="text-lime-400">{order.code}</strong> y te respondemos de inmediato.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lime mt-4 w-full flex items-center justify-center gap-2"
              >
                <Icon name="whatsapp" className="h-4 w-4" /> Escribir a WhatsApp
              </a>
            </div>

            <Link href="/pedido" className="flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-ink/40 transition hover:text-jungle-700">
              <Icon name="search" className="h-3.5 w-3.5" /> Buscar otro pedido
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
