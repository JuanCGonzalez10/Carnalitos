"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCOP } from "@/lib/store/format";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
} from "@/lib/utils/format";
import type { Order } from "@/types";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
const PAYMENT_METHODS = ["cash", "nequi", "bancolombia", "card", "transfer", "other"] as const;

export default function OrderDetail({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [form, setForm] = useState({
    status: initialOrder.status,
    paymentStatus: initialOrder.paymentStatus,
    paymentMethod: initialOrder.paymentMethod,
    adminNotes: initialOrder.adminNotes,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el pedido.");
      setOrder(data.order as Order);
      setMessage({ type: "ok", text: "Pedido actualizado correctamente." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar el pedido." });
    } finally {
      setBusy(false);
    }
  }

  const whatsapp = `https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola ${order.customerName}, te escribimos de Carnalitos por tu pedido ${order.code}.`,
  )}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin/pedidos" className="link-arrow !text-[9px]">
            <Icon name="chevron-left" className="h-3.5 w-3.5" /> Volver a pedidos
          </Link>
          <h1 className="mt-2 font-display text-3xl uppercase sm:text-4xl">{order.code}</h1>
          <p className="mt-2 text-[12px] text-ink/45">Creado el {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} type="payment" />
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <div className="space-y-4">
          <section className="admin-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl uppercase">Productos del pedido</h2>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/35">
                {order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0} unidades
              </span>
            </div>
            <div className="mt-4 divide-y divide-ink/[0.06]">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-200">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="tag" className="h-4 w-4 text-ink/30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold">{item.productName}</p>
                    <p className="mt-0.5 text-[10px] text-ink/40">
                      {item.quantity} × {formatCOP(item.unitPrice)}
                    </p>
                    {item.productId && (
                      <Link href={`/producto/${item.productId}`} className="text-[9px] font-bold uppercase tracking-widest text-jungle-700 hover:underline">
                        Ver producto
                      </Link>
                    )}
                  </div>
                  <p className="text-[12px] font-bold">{formatCOP(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
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

          <section className="admin-card">
            <h2 className="text-xl uppercase">Gestión del pedido</h2>
            <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Estado del pedido</label>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as typeof form.status })} className="admin-input">
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                  ))}
                </select>
                {form.status === "cancelled" && order.status !== "cancelled" && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-4 text-yellow-800">
                    <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Al cancelar se devuelve el stock de los productos.
                  </p>
                )}
              </div>
              <div>
                <label className="admin-label">Estado del pago</label>
                <select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as typeof form.paymentStatus })} className="admin-input">
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{PAYMENT_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Método de pago</label>
                <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as typeof form.paymentMethod })} className="admin-input">
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Notas internas</label>
                <textarea rows={4} value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} className="admin-textarea" placeholder="Información de despacho, acuerdos de pago, novedades..." />
                <p className="mt-1 text-[10px] text-ink/35">Estas notas son privadas y no se muestran al cliente.</p>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                <button type="submit" disabled={busy} className="btn-jungle btn-sm">
                  <Icon name="check" className="h-3.5 w-3.5" /> {busy ? "Guardando..." : "Guardar cambios"}
                </button>
                {order.customerPhone && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
                    <Icon name="whatsapp" className="h-3.5 w-3.5" /> Escribir al cliente
                  </a>
                )}
                <a href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Tu pedido ${order.code} en Carnalitos`)}`} className="btn-outline btn-sm">
                  <Icon name="mail" className="h-3.5 w-3.5" /> Enviar correo
                </a>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Cliente</p>
            <p className="mt-2 text-base font-bold">{order.customerName}</p>
            <div className="mt-2 space-y-1.5 text-[12px] text-ink/55">
              <p className="flex items-center gap-2"><Icon name="mail" className="h-3.5 w-3.5 text-jungle-600" /> {order.customerEmail}</p>
              <p className="flex items-center gap-2"><Icon name="phone" className="h-3.5 w-3.5 text-jungle-600" /> {order.customerPhone}</p>
            </div>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Entrega</p>
            <p className="mt-2 flex items-center gap-2 font-display text-xl uppercase">
              <Icon name="truck" className="h-4 w-4 text-jungle-700" /> {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            </p>
            <div className="mt-3 space-y-1.5 text-[12px] leading-5 text-ink/55">
              {order.deliveryMethod === "pickup" ? (
                <p>El cliente recoge en tienda.</p>
              ) : (
                <>
                  <p>{order.address}</p>
                  <p>{order.city}</p>
                </>
              )}
              {order.notes && <p className="text-[11px] text-ink/40">Notas del cliente: {order.notes}</p>}
            </div>
            <div className="mt-4 border-t border-ink/10 pt-3">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Pago</p>
              <p className="mt-1 text-[12px] font-semibold">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Historial</p>
            <div className="mt-3 space-y-2 text-[11px] text-ink/50">
              <p className="flex items-start gap-2"><Icon name="package" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" /> Creado: {formatDateTime(order.createdAt)}</p>
              <p className="flex items-start gap-2"><Icon name="clock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" /> Última actualización: {formatDateTime(order.updatedAt)}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
