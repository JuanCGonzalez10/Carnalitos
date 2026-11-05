"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/store/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatDateTime } from "@/lib/utils/format";
import type { Order } from "@/types";

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;

export default function OrdersManager({
  initialOrders,
  initialStatus = "all",
}: {
  initialOrders: Order[];
  initialStatus?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!term) return true;
      return (
        order.code.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.customerPhone.toLowerCase().includes(term)
      );
    });
  }, [orders, status, search]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length };
    for (const value of STATUSES) {
      result[value] = orders.filter((order) => order.status === value).length;
    }
    return result;
  }, [orders]);

  async function updateOrder(order: Order, patch: Record<string, unknown>) {
    setBusyId(order.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el pedido.");
      const saved = data.order as Order;
      setOrders((previous) => previous.map((item) => (item.id === saved.id ? saved : item)));
      setMessage({ type: "ok", text: `Pedido ${saved.code} actualizado.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar el pedido." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Operación</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Pedidos</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Consulta los pedidos de la tienda, actualiza su estado y confirma los pagos.
          </p>
        </div>
        <Link href="/admin/reportes" className="btn-outline btn-sm">
          <Icon name="chart" className="h-3.5 w-3.5" /> Ver reportes
        </Link>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="admin-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hide-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-cream-100 p-1">
            {[{ value: "all", label: "Todos" }, ...STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }))].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatus(item.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                  status === item.value ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
                }`}
              >
                {item.label} ({counts[item.value] ?? 0})
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Código, cliente o teléfono"
              className="admin-input pl-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className={busyId === order.id ? "opacity-50" : ""}>
                  <td>
                    <Link href={`/admin/pedidos/${order.id}`} className="font-mono text-[11px] font-bold text-jungle-800 hover:underline">
                      {order.code}
                    </Link>
                    <p className="mt-0.5 text-[10px] text-ink/40">{order.itemsCount ?? 0} artículo{order.itemsCount === 1 ? "" : "s"}</p>
                  </td>
                  <td>
                    <p className="text-[12px] font-semibold">{order.customerName}</p>
                    <p className="text-[10px] text-ink/40">{order.customerPhone}</p>
                  </td>
                  <td className="text-[11px] text-ink/50">{formatDateTime(order.createdAt)}</td>
                  <td className="text-[12px] font-semibold">{formatCOP(order.total)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) => updateOrder(order, { status: event.target.value })}
                      disabled={busyId === order.id}
                      className="rounded-md border border-ink/10 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/65 focus:border-jungle-500 focus:outline-none"
                      aria-label={`Estado del pedido ${order.code}`}
                    >
                      {STATUSES.map((value) => (
                        <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => updateOrder(order, { paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid" })}
                      disabled={busyId === order.id}
                      className={`badge ${order.paymentStatus === "paid" ? "bg-jungle-50 text-jungle-700" : "bg-sun-100 text-yellow-800"}`}
                      title="Cambiar estado del pago"
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/pedidos/${order.id}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-ink/50 transition hover:border-jungle-500 hover:text-jungle-700" title="Ver detalle">
                        <Icon name="eye" className="h-3.5 w-3.5" />
                      </Link>
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${order.customerName}, te escribimos de Carnalitos por tu pedido ${order.code}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 text-jungle-700 transition hover:border-jungle-500"
                          title="Escribir por WhatsApp"
                        >
                          <Icon name="whatsapp" className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-ink/35">
                    No hay pedidos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Pedidos</p>
          <p className="mt-1 font-display text-2xl leading-none">{orders.length}</p>
        </div>
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Por cobrar</p>
          <p className="mt-1 font-display text-2xl leading-none text-yellow-700">
            {formatCOP(orders.filter((order) => order.paymentStatus === "unpaid" && order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0))}
          </p>
        </div>
        <div className="admin-card !p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Cobrado</p>
          <p className="mt-1 font-display text-2xl leading-none text-jungle-800">
            {formatCOP(orders.filter((order) => order.paymentStatus === "paid" && order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}
