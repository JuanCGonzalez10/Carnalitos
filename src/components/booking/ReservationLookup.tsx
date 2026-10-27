"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import SmartImage from "@/components/ui/SmartImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCOP } from "@/lib/booking/pricing";
import { PAYMENT_METHOD_LABELS, formatDate, formatDateTime } from "@/lib/utils/format";
import type { Booking } from "@/types";

export default function ReservationLookup({
  whatsapp,
  checkInTime,
  checkOutTime,
}: {
  whatsapp: string;
  checkInTime: string;
  checkOutTime: string;
}) {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const autoRef = useRef(false);

  async function lookup(nextCode: string, nextEmail: string) {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const response = await fetch(
        `/api/bookings/lookup?code=${encodeURIComponent(nextCode.trim())}&email=${encodeURIComponent(nextEmail.trim())}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No encontramos la reserva.");
      setBooking(data.booking as Booking);
    } catch (lookupError) {
      setBooking(null);
      setError(lookupError instanceof Error ? lookupError.message : "No encontramos la reserva.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const initialCode = params.get("code") ?? "";
    const initialEmail = params.get("email") ?? "";
    if (initialCode && initialEmail) {
      autoRef.current = true;
      setCode(initialCode);
      setEmail(initialEmail);
      void lookup(initialCode, initialEmail);
    }
  }, []);

  const contactUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    booking
      ? `Hola, quiero información sobre mi reserva ${booking.code}.`
      : "Hola, necesito ayuda con una reserva en Adrenalina Extrema Huila.",
  )}`;

  return (
    <div className="container-site grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <div>
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 sm:p-7">
          <p className="eyebrow">Mi reserva</p>
          <h1 className="mt-3 text-3xl uppercase sm:text-4xl">Consulta tu reserva</h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">
            Ingresa el código que recibiste al reservar y el correo con el que hiciste la reserva.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void lookup(code, email);
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="lookup-code" className="field-label">Código de reserva</label>
              <input
                id="lookup-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="AEH-XXXXXX"
                className="field font-mono uppercase tracking-widest"
              />
            </div>
            <div>
              <label htmlFor="lookup-email" className="field-label">Correo electrónico</label>
              <input
                id="lookup-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-lime w-full">
              {loading ? "Consultando..." : "Buscar reserva"} <Icon name="search" className="h-4 w-4" />
            </button>
          </form>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="mt-6 border-t border-ink/10 pt-5 text-sm text-ink/50">
            <p>¿No encuentras tu código?</p>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="link-arrow mt-2">
              <Icon name="whatsapp" className="h-4 w-4" /> Escríbenos por WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-ink/[0.08] bg-cream-50 p-5 text-xs leading-6 text-ink/50">
          <p className="flex items-center gap-2 font-bold text-ink/70"><Icon name="shield" className="h-4 w-4 text-jungle-600" /> Privacidad</p>
          <p className="mt-2">
            Por seguridad, solo mostramos los datos de la reserva cuando el código y el correo coinciden. Si necesitas cambiar fechas o cancelar, contáctanos por WhatsApp.
          </p>
        </div>
      </div>

      <div>
        {booking ? (
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
            <div className="relative h-40 bg-ink sm:h-48">
              <SmartImage src={booking.glampingImage || "/images/glamping-bosque.jpg"} alt={booking.glampingName ?? "Alojamiento"} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-lime-400">{booking.code}</p>
                <h2 className="mt-1 font-display text-2xl uppercase leading-none sm:text-3xl">{booking.glampingName}</h2>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={booking.status} />
                <StatusBadge status={booking.paymentStatus} type="payment" />
                <span className="badge bg-cream-100 text-ink/45">Creada {formatDateTime(booking.createdAt)}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Huésped</p>
                  <p className="mt-1 text-sm font-bold">{booking.guestName}</p>
                  <p className="text-xs text-ink/45">{booking.guestEmail}</p>
                  <p className="text-xs text-ink/45">{booking.guestPhone}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Fechas</p>
                  <p className="mt-1 text-sm font-bold">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                  <p className="text-xs text-ink/45">{booking.nights} noches · {booking.guests} huéspedes</p>
                  <p className="text-xs text-ink/45">Check-in {checkInTime} · Check-out {checkOutTime}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
                <p className="flex justify-between gap-3 text-ink/55"><span>Alojamiento ({booking.nights} noches)</span><span>{formatCOP(booking.subtotal)}</span></p>
                {booking.activitiesTotal > 0 && <p className="flex justify-between gap-3 text-ink/55"><span>Actividades</span><span>{formatCOP(booking.activitiesTotal)}</span></p>}
                {booking.servicesTotal > 0 && <p className="flex justify-between gap-3 text-ink/55"><span>Servicios</span><span>{formatCOP(booking.servicesTotal)}</span></p>}
                <p className="flex justify-between gap-3 border-t border-ink/10 pt-2 text-base font-bold"><span>Total</span><span>{formatCOP(booking.total)}</span></p>
                <p className="flex justify-between gap-3 text-jungle-700"><span>Pagado</span><span className="font-bold">{formatCOP(booking.paidAmount)}</span></p>
                <p className="flex justify-between gap-3 text-base font-bold"><span>Saldo pendiente</span><span>{formatCOP(booking.balance)}</span></p>
              </div>

              {booking.activities && booking.activities.length > 0 && (
                <div className="mt-4 rounded-xl bg-cream-50 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Actividades incluidas</p>
                  <ul className="mt-2 space-y-1 text-xs text-ink/60">
                    {booking.activities.map((line) => (
                      <li key={line.id} className="flex justify-between gap-3"><span>{line.activityName} × {line.quantity}</span><span>{formatCOP(line.total)}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {booking.services && booking.services.length > 0 && (
                <div className="mt-3 rounded-xl bg-cream-50 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Servicios adicionales</p>
                  <ul className="mt-2 space-y-1 text-xs text-ink/60">
                    {booking.services.map((line) => (
                      <li key={line.id} className="flex justify-between gap-3"><span>{line.serviceName} × {line.quantity}</span><span>{formatCOP(line.total)}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {booking.payments && booking.payments.length > 0 && (
                <div className="mt-3 rounded-xl border border-ink/10 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Pagos registrados</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-ink/60">
                    {booking.payments.map((payment) => (
                      <li key={payment.id} className="flex justify-between gap-3">
                        <span>{formatDate(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
                        <span className="font-semibold">{formatCOP(payment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {booking.paymentStatus !== "paid" && (
                <div className="mt-4 rounded-xl border border-sun-400/40 bg-sun-100/50 p-4 text-xs leading-5 text-ink/65">
                  <p className="font-bold text-yellow-900">Anticipo pendiente: {formatCOP(booking.depositRequired)}</p>
                  <p className="mt-1">Escríbenos por WhatsApp con tu código para coordinar el pago y confirmar la reserva.</p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="btn-jungle flex-1">
                  <Icon name="whatsapp" className="h-4 w-4" /> Contactar por WhatsApp
                </a>
                <Link href="/reservar" className="btn-outline flex-1">Hacer otra reserva</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-cream-50 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-jungle-600 shadow-sm">
              <Icon name="ticket" className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-2xl uppercase">{searched && !loading ? "Sin resultados" : "Tu reserva, siempre a mano"}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink/45">
              {searched && !loading
                ? "Revisa el código y el correo, o escríbenos por WhatsApp para ayudarte."
                : "Completa el formulario para ver el estado de tu reserva, tus pagos y el saldo pendiente."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/35">
              <span className="rounded-full bg-white px-3 py-1.5">Código</span>
              <span className="rounded-full bg-white px-3 py-1.5">Correo</span>
              <span className="rounded-full bg-white px-3 py-1.5">Estado</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
