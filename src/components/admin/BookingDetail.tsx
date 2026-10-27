"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCOP, todayInColombia } from "@/lib/booking/pricing";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/utils/format";
import type { Booking, PaymentMethod } from "@/types";

const STATUS_FLOW: Booking["status"][] = ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"];

type Message = { type: "ok" | "error" | "info"; text: string } | null;

function money(value: number) {
  return formatCOP(value);
}

export default function BookingDetail({
  initial,
  whatsapp,
  checkInTime,
  checkOutTime,
}: {
  initial: Booking;
  whatsapp: string;
  checkInTime: string;
  checkOutTime: string;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const [stay, setStay] = useState({
    checkIn: initial.checkIn,
    checkOut: initial.checkOut,
    guests: String(initial.guests),
    depositRequired: String(initial.depositRequired),
  });

  const [payment, setPayment] = useState({
    amount: String(initial.balance),
    method: "nequi" as PaymentMethod,
    reference: "",
    paidAt: todayInColombia(),
    notes: "",
  });

  const [adminNotes, setAdminNotes] = useState(initial.adminNotes ?? "");

  function applyBooking(next: Booking) {
    setBooking(next);
    setStay({
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      guests: String(next.guests),
      depositRequired: String(next.depositRequired),
    });
    setPayment((previous) => ({ ...previous, amount: String(next.balance) }));
    setAdminNotes(next.adminNotes ?? "");
  }

  async function patchBooking(payload: Record<string, unknown>, key: string, successText: string) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la reserva.");
      applyBooking(data.booking as Booking);
      setMessage({ type: "ok", text: successText });
      router.refresh();
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar la reserva." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(next: Booking["status"]) {
    if (next === booking.status) return;
    if (next === "cancelled" && !window.confirm("¿Cancelar esta reserva? El alojamiento quedará libre en esas fechas.")) return;
    if (next === "no_show" && !window.confirm("¿Marcar la reserva como no show?")) return;
    await patchBooking({ status: next }, `status:${next}`, `Estado actualizado a ${BOOKING_STATUS_LABELS[next].toLowerCase()}.`);
  }

  async function saveStay(event: React.FormEvent) {
    event.preventDefault();
    const payload: Record<string, unknown> = {
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: Number(stay.guests),
    };
    if (Number(stay.depositRequired) !== booking.depositRequired) {
      payload.depositRequired = Number(stay.depositRequired);
    }
    await patchBooking(payload, "stay", "Fechas y huéspedes actualizados.");
  }

  async function saveNotes() {
    await patchBooking({ adminNotes }, "notes", "Notas internas guardadas.");
  }

  async function addPayment(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Ingresa un valor de pago válido." });
      return;
    }
    setBusy("payment");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: payment.method,
          reference: payment.reference,
          paidAt: payment.paidAt || undefined,
          notes: payment.notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el pago.");
      applyBooking(data.booking as Booking);
      setPayment((previous) => ({ ...previous, amount: String((data.booking as Booking).balance), reference: "", notes: "" }));
      setMessage({ type: "ok", text: "Pago registrado y saldo actualizado." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo registrar el pago." });
    } finally {
      setBusy(null);
    }
  }

  async function removePayment(paymentId: string, amount: number) {
    if (!window.confirm(`¿Eliminar el pago de ${money(amount)}? El saldo se recalculará.`)) return;
    setBusy(`payment:${paymentId}`);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/payments?paymentId=${paymentId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el pago.");
      applyBooking(data.booking as Booking);
      setMessage({ type: "ok", text: "Pago eliminado y saldo recalculado." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el pago." });
    } finally {
      setBusy(null);
    }
  }

  async function requestInvoice() {
    setBusy("invoice");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/invoice`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "La facturación electrónica no está disponible.");
      setMessage({ type: "ok", text: data.message ?? "Factura solicitada." });
    } catch (error) {
      setMessage({ type: "info", text: error instanceof Error ? error.message : "La facturación electrónica no está disponible." });
    } finally {
      setBusy(null);
    }
  }

  const paidPercent = booking.total > 0 ? Math.min(100, Math.round((booking.paidAmount / booking.total) * 100)) : 0;
  const guestWhatsApp = `https://wa.me/${booking.guestPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola ${booking.guestName}, te escribimos de Adrenalina Extrema Huila sobre tu reserva ${booking.code}.`,
  )}`;
  const businessWhatsApp = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola, necesito ayuda con la reserva ${booking.code}.`,
  )}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin/reservas" className="link-arrow !text-[9px]">
            <Icon name="chevron-left" className="h-3 w-3" /> Volver a reservas
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl uppercase leading-none sm:text-4xl">{booking.code}</h1>
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} type="payment" />
          </div>
          <p className="mt-2 text-[11px] text-ink/40">
            Creada el {formatDateTime(booking.createdAt)} · Actualizada el {formatDateTime(booking.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/bookings/${booking.id}/receipt`} target="_blank" rel="noreferrer" className="btn-dark btn-sm">
            <Icon name="receipt" className="h-3.5 w-3.5" /> Comprobante PDF
          </a>
          <button onClick={requestInvoice} disabled={busy === "invoice"} className="btn-outline btn-sm">
            <Icon name="invoice" className="h-3.5 w-3.5" /> {busy === "invoice" ? "Consultando..." : "Factura electrónica"}
          </button>
          <a href={guestWhatsApp} target="_blank" rel="noreferrer" className="btn-jungle btn-sm">
            <Icon name="whatsapp" className="h-3.5 w-3.5" /> WhatsApp huésped
          </a>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-jungle-50 text-jungle-800"
              : message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-sun-100/70 text-yellow-900"
          }`}
        >
          <span className="flex items-start gap-2">
            <Icon name={message.type === "ok" ? "check" : "alert"} className="mt-0.5 h-4 w-4 shrink-0" />
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} aria-label="Cerrar aviso" className="shrink-0 opacity-50 hover:opacity-100">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="admin-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:h-24 sm:w-36">
                <SmartImage
                  src={booking.glampingImage || "/images/glamping-bosque.jpg"}
                  alt={booking.glampingName ?? "Alojamiento"}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Alojamiento</p>
                <h2 className="mt-1 text-2xl uppercase leading-none">{booking.glampingName}</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-ink/60 sm:grid-cols-4">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Llegada</p>
                    <p className="mt-0.5 font-semibold">{formatDate(booking.checkIn)}</p>
                    <p className="text-[10px] text-ink/40">desde {checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Salida</p>
                    <p className="mt-0.5 font-semibold">{formatDate(booking.checkOut)}</p>
                    <p className="text-[10px] text-ink/40">hasta {checkOutTime}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Noches</p>
                    <p className="mt-0.5 font-semibold">{booking.nights}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Huéspedes</p>
                    <p className="mt-0.5 font-semibold">{booking.guests}</p>
                  </div>
                </div>
                {booking.glampingSlug && (
                  <Link href={`/glampings/${booking.glampingSlug}`} target="_blank" className="link-arrow mt-4 !text-[9px]">
                    Ver página pública <Icon name="external" className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Huésped principal</p>
                <h2 className="mt-1 text-xl uppercase">Datos de contacto</h2>
              </div>
              <a href={businessWhatsApp} target="_blank" rel="noreferrer" className="text-[10px] font-extrabold uppercase tracking-widest text-jungle-700 hover:underline">
                Contactar
              </a>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Nombre</p>
                <p className="mt-1 text-sm font-semibold">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Documento</p>
                <p className="mt-1 text-sm text-ink/65">{booking.guestDocument || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Correo</p>
                <a href={`mailto:${booking.guestEmail}`} className="mt-1 block break-all text-sm text-jungle-700 hover:underline">{booking.guestEmail}</a>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Teléfono</p>
                <a href={`tel:${booking.guestPhone}`} className="mt-1 block text-sm text-jungle-700 hover:underline">{booking.guestPhone}</a>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Ciudad</p>
                <p className="mt-1 text-sm text-ink/65">{booking.guestCity || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Origen</p>
                <p className="mt-1 text-sm capitalize text-ink/65">{booking.source}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 rounded-lg bg-cream-50 p-3">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/30">Solicitudes del huésped</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink/65">{booking.notes}</p>
              </div>
            )}
          </section>

          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Estadía</p>
              <h2 className="mt-1 text-xl uppercase">Modificar fechas y huéspedes</h2>
              <p className="mt-1 text-[11px] text-ink/40">
                Al cambiar las fechas se validan bloqueos, capacidad y cruces de reservas. El valor se recalcula automáticamente.
              </p>
            </div>
            <form onSubmit={saveStay} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="stay-checkin" className="admin-label">Llegada</label>
                <input
                  id="stay-checkin"
                  type="date"
                  value={stay.checkIn}
                  onChange={(event) => setStay({ ...stay, checkIn: event.target.value })}
                  className="admin-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="stay-checkout" className="admin-label">Salida</label>
                <input
                  id="stay-checkout"
                  type="date"
                  value={stay.checkOut}
                  onChange={(event) => setStay({ ...stay, checkOut: event.target.value })}
                  className="admin-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="stay-guests" className="admin-label">Huéspedes</label>
                <input
                  id="stay-guests"
                  type="number"
                  min={1}
                  max={30}
                  value={stay.guests}
                  onChange={(event) => setStay({ ...stay, guests: event.target.value })}
                  className="admin-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="stay-deposit" className="admin-label">Anticipo requerido</label>
                <input
                  id="stay-deposit"
                  type="number"
                  min={0}
                  step={100}
                  value={stay.depositRequired}
                  onChange={(event) => setStay({ ...stay, depositRequired: event.target.value })}
                  className="admin-input"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <button type="submit" disabled={busy === "stay"} className="btn-jungle btn-sm">
                  <Icon name="check" className="h-3.5 w-3.5" /> {busy === "stay" ? "Guardando..." : "Guardar cambios de estadía"}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Extras</p>
                <h2 className="mt-1 text-xl uppercase">Actividades y servicios</h2>
              </div>
              <span className="badge bg-cream-100 text-ink/50">
                {(booking.activities?.length ?? 0) + (booking.services?.length ?? 0)} ítems
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="admin-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Valor unitario</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(booking.activities ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="text-[12px] font-semibold">{item.activityName}</td>
                      <td className="text-[11px] text-ink/45">Actividad</td>
                      <td className="text-[12px] text-ink/60">{item.quantity}</td>
                      <td className="text-[12px] text-ink/60">{money(item.unitPrice)}</td>
                      <td className="text-right text-[12px] font-semibold">{money(item.total)}</td>
                    </tr>
                  ))}
                  {(booking.services ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="text-[12px] font-semibold">{item.serviceName}</td>
                      <td className="text-[11px] text-ink/45">Servicio</td>
                      <td className="text-[12px] text-ink/60">{item.quantity}</td>
                      <td className="text-[12px] text-ink/60">{money(item.unitPrice)}</td>
                      <td className="text-right text-[12px] font-semibold">{money(item.total)}</td>
                    </tr>
                  ))}
                  {(booking.activities?.length ?? 0) + (booking.services?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-ink/35">
                        Esta reserva no incluye actividades ni servicios adicionales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-2 border-t border-ink/[0.06] pt-4 text-[12px] sm:grid-cols-3">
              <div className="flex justify-between gap-2 sm:block">
                <span className="text-ink/40">Alojamiento</span>
                <span className="block font-semibold">{money(booking.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <span className="text-ink/40">Actividades</span>
                <span className="block font-semibold">{money(booking.activitiesTotal)}</span>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <span className="text-ink/40">Servicios</span>
                <span className="block font-semibold">{money(booking.servicesTotal)}</span>
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Cartera</p>
                <h2 className="mt-1 text-xl uppercase">Pagos registrados</h2>
              </div>
              <span className="badge bg-lime-100 text-lime-800">{money(booking.paidAmount)} cobrados</span>
            </div>

            <div className="mt-4 space-y-2">
              {(booking.payments ?? []).map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-ink/[0.07] bg-cream-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-jungle-700">
                      <Icon name="money" className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-bold">{money(item.amount)} <span className="font-normal text-ink/40">· {PAYMENT_METHOD_LABELS[item.method] ?? item.method}</span></p>
                      <p className="text-[10px] text-ink/40">
                        {formatDate(item.paidAt)}
                        {item.reference ? ` · Ref. ${item.reference}` : ""}
                        {item.notes ? ` · ${item.notes}` : ""}
                      </p>
                      <p className="text-[9px] text-ink/30">Registrado por {item.createdBy || "sistema"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removePayment(item.id, item.amount)}
                    disabled={busy === `payment:${item.id}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-lg text-ink/30 transition hover:bg-red-50 hover:text-red-600 sm:self-center"
                    title="Eliminar pago"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(booking.payments?.length ?? 0) === 0 && (
                <p className="rounded-xl bg-cream-50 py-8 text-center text-sm text-ink/35">
                  Aún no hay pagos registrados. El saldo pendiente es {money(booking.balance)}.
                </p>
              )}
            </div>

            <form onSubmit={addPayment} className="mt-5 rounded-xl border border-ink/[0.08] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink/45">Registrar un pago o abono</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="pay-amount" className="admin-label">Valor</label>
                  <input
                    id="pay-amount"
                    type="number"
                    min={1}
                    step={100}
                    max={booking.balance > 0 ? booking.balance : undefined}
                    value={payment.amount}
                    onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pay-method" className="admin-label">Método</label>
                  <select
                    id="pay-method"
                    value={payment.method}
                    onChange={(event) => setPayment({ ...payment, method: event.target.value as PaymentMethod })}
                    className="admin-input"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pay-date" className="admin-label">Fecha</label>
                  <input
                    id="pay-date"
                    type="date"
                    value={payment.paidAt}
                    onChange={(event) => setPayment({ ...payment, paidAt: event.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label htmlFor="pay-reference" className="admin-label">Referencia</label>
                  <input
                    id="pay-reference"
                    value={payment.reference}
                    onChange={(event) => setPayment({ ...payment, reference: event.target.value })}
                    placeholder="Opcional"
                    className="admin-input"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="pay-notes" className="admin-label">Nota</label>
                  <input
                    id="pay-notes"
                    value={payment.notes}
                    onChange={(event) => setPayment({ ...payment, notes: event.target.value })}
                    placeholder="Ej. abono por Nequi, saldo acordado"
                    className="admin-input"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={busy === "payment" || booking.balance <= 0} className="btn-lime btn-sm w-full">
                    <Icon name="plus" className="h-3.5 w-3.5" /> {busy === "payment" ? "Guardando..." : "Registrar pago"}
                  </button>
                </div>
              </div>
              {booking.balance <= 0 && (
                <p className="mt-2 text-[11px] font-semibold text-jungle-700">Esta reserva no tiene saldo pendiente.</p>
              )}
            </form>
          </section>

          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Uso interno</p>
              <h2 className="mt-1 text-xl uppercase">Notas administrativas</h2>
            </div>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={4}
              placeholder="Acuerdos, observaciones de pago, solicitudes especiales..."
              className="admin-textarea mt-4"
            />
            <button onClick={saveNotes} disabled={busy === "notes"} className="btn-outline btn-sm mt-3">
              <Icon name="check" className="h-3.5 w-3.5" /> {busy === "notes" ? "Guardando..." : "Guardar notas"}
            </button>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="admin-card xl:sticky xl:top-20">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Resumen financiero</p>
            <h2 className="mt-1 text-xl uppercase">Valores de la reserva</h2>

            <div className="mt-4 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-ink/45">Alojamiento</span>
                <span className="font-semibold">{money(booking.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/45">Actividades</span>
                <span className="font-semibold">{money(booking.activitiesTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/45">Servicios</span>
                <span className="font-semibold">{money(booking.servicesTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-ink/[0.08] pt-2.5 text-[14px]">
                <span className="font-bold">Total</span>
                <span className="font-display text-lg">{money(booking.total)}</span>
              </div>
              <div className="flex items-center justify-between text-jungle-700">
                <span>Pagado</span>
                <span className="font-semibold">{money(booking.paidAmount)}</span>
              </div>
              <div className={`flex items-center justify-between ${booking.balance > 0 ? "text-yellow-800" : "text-ink/40"}`}>
                <span>Saldo pendiente</span>
                <span className="font-bold">{money(booking.balance)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-ink/35">
                <span>Progreso de pago</span>
                <span>{paidPercent}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-200">
                <div className="h-full rounded-full bg-gradient-to-r from-jungle-600 to-lime-400 transition-all" style={{ width: `${paidPercent}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-ink/40">Anticipo requerido: {money(booking.depositRequired)}</p>
            </div>

            <div className="mt-5 space-y-2">
              <a href={`/api/admin/bookings/${booking.id}/receipt`} target="_blank" rel="noreferrer" className="btn-dark btn-sm w-full">
                <Icon name="download" className="h-3.5 w-3.5" /> Descargar comprobante
              </a>
              <Link href={`/reserva?code=${encodeURIComponent(booking.code)}&email=${encodeURIComponent(booking.guestEmail)}`} target="_blank" className="btn-outline btn-sm w-full">
                <Icon name="external" className="h-3.5 w-3.5" /> Ver como huésped
              </Link>
            </div>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Flujo de la reserva</p>
            <h2 className="mt-1 text-xl uppercase">Cambiar estado</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STATUS_FLOW.map((status) => {
                const active = booking.status === status;
                const danger = status === "cancelled" || status === "no_show";
                return (
                  <button
                    key={status}
                    onClick={() => changeStatus(status)}
                    disabled={busy !== null || active}
                    className={`rounded-lg border px-2 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] transition ${
                      active
                        ? "border-jungle-600 bg-jungle-600 text-white"
                        : danger
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-ink/10 text-ink/55 hover:border-jungle-500 hover:text-jungle-700"
                    } disabled:cursor-default`}
                  >
                    {BOOKING_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-ink/35">
              Cancelar libera las fechas. Confirmar habilita el registro de pagos y la comunicación con el huésped.
            </p>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Trazabilidad</p>
            <h2 className="mt-1 text-xl uppercase">Historial</h2>
            <div className="mt-4 space-y-3">
              {(booking.history ?? []).map((item) => (
                <div key={item.id} className="relative border-l border-ink/10 pl-4">
                  <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-jungle-500" />
                  <p className="text-[11px] font-bold">
                    {item.fromStatus ? `${BOOKING_STATUS_LABELS[item.fromStatus] ?? item.fromStatus} → ` : ""}
                    {BOOKING_STATUS_LABELS[item.toStatus] ?? item.toStatus}
                  </p>
                  <p className="text-[10px] leading-4 text-ink/40">{item.note}</p>
                  <p className="mt-0.5 text-[9px] text-ink/30">{formatDateTime(item.createdAt)} · {item.createdBy}</p>
                </div>
              ))}
              {(booking.history?.length ?? 0) === 0 && (
                <p className="text-[11px] text-ink/35">Sin cambios de estado registrados.</p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Referencia</p>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink/40">Código</dt>
                <dd className="font-mono font-bold">{booking.code}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink/40">Tarifa noche</dt>
                <dd className="font-semibold">{money(booking.nightlyRate)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink/40">Anticipo</dt>
                <dd className="font-semibold">{money(booking.depositRequired)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink/40">ID</dt>
                <dd className="max-w-[180px] truncate font-mono text-[9px] text-ink/45" title={booking.id}>{booking.id}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
