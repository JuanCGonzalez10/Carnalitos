"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import GlampingQuickView from "@/components/booking/GlampingQuickView";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { addDays, formatCOP, getActivityUnitPrice, nightsBetween, todayInColombia } from "@/lib/booking/pricing";
import { formatDate } from "@/lib/utils/format";
import type { Activity, AvailabilityItem, Glamping, Service, Settings } from "@/types";

interface ClientQuote {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  activitiesTotal: number;
  servicesTotal: number;
  total: number;
  depositRequired: number;
  rateName: string;
  activityLines: Array<{
    activityId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    priceLabel?: string;
    priceKind?: "holiday" | "weekend" | "base";
  }>;
  serviceLines: Array<{ serviceId: string; name: string; quantity: number; unitPrice: number; total: number }>;
}

interface CreatedBooking {
  code: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  depositRequired: number;
  status: string;
  paymentStatus: string;
  guestName: string;
  guestEmail: string;
  glampingName?: string;
}

const STEPS = ["Fechas y refugio", "Tu experiencia", "Tus datos"];

export default function BookingWizard({
  glampings,
  activities,
  services,
  settings,
}: {
  glampings: Glamping[];
  activities: Activity[];
  services: Service[];
  settings: Settings;
}) {
  const searchParams = useSearchParams();
  const today = todayInColombia();

  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState(addDays(today, 7));
  const [checkOut, setCheckOut] = useState(addDays(today, 9));
  const [guests, setGuests] = useState(2);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activityQty, setActivityQty] = useState<Record<string, number>>({});
  const [serviceQty, setServiceQty] = useState<Record<string, number>>({});

  const [availability, setAvailability] = useState<AvailabilityItem[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [quickViewItem, setQuickViewItem] = useState<AvailabilityItem | null>(null);

  const [quote, setQuote] = useState<ClientQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [guest, setGuest] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestDocument: "",
    guestCity: "",
    notes: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ booking: CreatedBooking; whatsappUrl: string } | null>(null);

  const [initialized, setInitialized] = useState(false);

  const selected = useMemo(
    () => glampings.find((glamping) => glamping.slug === selectedSlug) ?? null,
    [glampings, selectedSlug],
  );

  const selectedItem = useMemo(
    () => availability?.find((item) => item.glamping.slug === selectedSlug) ?? null,
    [availability, selectedSlug],
  );

  const quickViewGlamping = useMemo(
    () =>
      quickViewItem
        ? glampings.find((glamping) => glamping.id === quickViewItem.glamping.id) ?? quickViewItem.glamping
        : null,
    [glampings, quickViewItem],
  );
  const quickViewSelected = Boolean(quickViewItem && quickViewItem.glamping.slug === selectedSlug);

  const closeQuickView = useCallback(() => setQuickViewItem(null), []);
  const chooseQuickView = useCallback(() => {
    if (quickViewItem?.available) setSelectedSlug(quickViewItem.glamping.slug);
    setQuickViewItem(null);
  }, [quickViewItem]);

  const activityPayload = useMemo(
    () =>
      Object.entries(activityQty)
        .filter(([, quantity]) => quantity > 0)
        .map(([activityId, quantity]) => ({ activityId, quantity })),
    [activityQty],
  );

  const servicePayload = useMemo(
    () =>
      Object.entries(serviceQty)
        .filter(([, quantity]) => quantity > 0)
        .map(([serviceId, quantity]) => ({ serviceId, quantity })),
    [serviceQty],
  );

  // Prefill from URL (home search bar, glamping/activity detail pages).
  useEffect(() => {
    if (initialized) return;
    const spGlamping = searchParams.get("glamping");
    const spCheckIn = searchParams.get("checkIn");
    const spCheckOut = searchParams.get("checkOut");
    const spGuests = Number(searchParams.get("guests"));
    const spActivity = searchParams.get("activity");

    if (spGlamping && glampings.some((item) => item.slug === spGlamping)) setSelectedSlug(spGlamping);
    if (spCheckIn && /^\d{4}-\d{2}-\d{2}$/.test(spCheckIn) && spCheckIn >= today) setCheckIn(spCheckIn);
    if (spCheckOut && /^\d{4}-\d{2}-\d{2}$/.test(spCheckOut)) setCheckOut(spCheckOut);
    if (Number.isInteger(spGuests) && spGuests >= 1 && spGuests <= settings.booking.maxGuests) setGuests(spGuests);
    if (spActivity) {
      const activity = activities.find((item) => item.slug === spActivity);
      if (activity) {
        const quantity = Math.min(Math.max(1, Number.isInteger(spGuests) && spGuests >= 1 ? spGuests : 2), activity.maxPeople ?? settings.booking.maxGuests);
        setActivityQty({ [activity.id]: quantity });
      }
    }
    setInitialized(true);
  }, [initialized, searchParams, glampings, activities, settings.booking.maxGuests, today]);

  // Availability for the selected dates.
  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo consultar la disponibilidad.");
        if (!cancelled) setAvailability(data.items as AvailabilityItem[]);
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setAvailability(null);
          setAvailabilityError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [checkIn, checkOut, guests]);

  // Clamp activity quantities when guest count changes.
  useEffect(() => {
    setActivityQty((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const activity of activities) {
        const max = Math.min(guests, activity.maxPeople ?? guests);
        if (next[activity.id] && next[activity.id] > max) {
          next[activity.id] = max;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [guests, activities]);

  // Live quote once a glamping is chosen.
  useEffect(() => {
    if (!selected || step < 2) return;
    let cancelled = false;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glampingId: selected.id,
          checkIn,
          checkOut,
          guests,
          activities: activityPayload,
          services: servicePayload,
        }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "No se pudo calcular el precio.");
          if (cancelled) return;
          setQuote(data.quote as ClientQuote);
          setQuoteError(data.available ? null : data.reason ?? "El alojamiento no está disponible en esas fechas.");
        })
        .catch((error: Error) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(error.message);
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selected, step, checkIn, checkOut, guests, activityPayload, servicePayload]);

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn && checkIn >= today);
  const nights = datesValid ? nightsBetween(checkIn, checkOut) : 0;
  const canChooseGlamping = datesValid && !availabilityLoading;
  const canContinue = Boolean(selectedItem?.available && selected);
  const maxGuests = settings.booking.maxGuests;
  const estimatedTotal = quote?.total ?? (selectedItem?.quote?.total ?? (selected ? selected.pricePerNight * nights : 0));

  function setActivity(activity: Activity, quantity: number) {
    const max = Math.min(guests, activity.maxPeople ?? guests);
    setActivityQty((previous) => ({ ...previous, [activity.id]: Math.max(0, Math.min(quantity, max)) }));
  }

  function setService(service: Service, quantity: number) {
    setServiceQty((previous) => ({ ...previous, [service.id]: Math.max(0, Math.min(quantity, 20)) }));
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !canContinue) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glampingId: selected.id,
          checkIn,
          checkOut,
          guests,
          activities: activityPayload,
          services: servicePayload,
          ...guest,
          acceptTerms: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear la reserva.");
      setCreated({ booking: data.booking as CreatedBooking, whatsappUrl: data.whatsappUrl as string });
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setCreated(null);
    setStep(1);
    setSelectedSlug(null);
    setActivityQty({});
    setServiceQty({});
    setQuote(null);
    setAcceptTerms(false);
    setGuest({ guestName: "", guestEmail: "", guestPhone: "", guestDocument: "", guestCity: "", notes: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (created) {
    const booking = created.booking;
    return (
      <div className="container-site max-w-4xl py-10 sm:py-16">
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
          <div className="bg-jungle-950 px-6 py-10 text-center text-white sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-400 text-ink">
              <Icon name="check" className="h-8 w-8" strokeWidth={2.5} />
            </span>
            <p className="eyebrow-light mt-5">Reserva recibida</p>
            <h1 className="mt-3 text-4xl uppercase sm:text-5xl">Nos vemos en el cañón</h1>
            <p className="mt-3 text-sm text-white/60">
              Guarda tu código. Te contactaremos para coordinar el pago del anticipo y confirmar tu reserva.
            </p>
            <p className="mt-5 inline-block rounded-full bg-white/10 px-6 py-3 font-display text-2xl tracking-[0.18em] text-lime-400">
              {booking.code}
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.paymentStatus} type="payment" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-cream-50 p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Alojamiento</p>
                <p className="mt-1 font-display text-xl uppercase">{booking.glampingName ?? selected?.name}</p>
                <p className="mt-1 text-xs text-ink/50">{booking.guests} huéspedes · {booking.nights} noche{booking.nights === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Fechas</p>
                <p className="mt-1 text-sm font-bold">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                <p className="mt-1 text-xs text-ink/50">Check-in {settings.booking.checkInTime} · Check-out {settings.booking.checkOutTime}</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Huésped principal</p>
                <p className="mt-1 text-sm font-bold">{booking.guestName}</p>
                <p className="mt-1 text-xs text-ink/50">{booking.guestEmail}</p>
              </div>
              <div className="rounded-xl bg-jungle-950 p-4 text-white">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/40">Total de la reserva</p>
                <p className="mt-1 font-display text-2xl text-lime-400">{formatCOP(booking.total)}</p>
                <p className="mt-1 text-xs text-white/55">Anticipo: {formatCOP(booking.depositRequired)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-sun-400/40 bg-sun-100/50 p-4 text-sm leading-6 text-ink/65">
              <p className="font-bold text-yellow-900">Siguiente paso: confirmar el anticipo</p>
              <p className="mt-1">
                Esta reserva queda <strong>pendiente</strong> hasta que registremos el pago del anticipo. Escríbenos por WhatsApp con tu código y te compartimos los medios de pago disponibles.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={created.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-lime flex-1">
                <Icon name="whatsapp" className="h-4 w-4" /> Enviar por WhatsApp
              </a>
              <Link href={`/reserva?code=${booking.code}&email=${encodeURIComponent(booking.guestEmail)}`} className="btn-dark flex-1">
                Ver mi reserva <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button onClick={resetWizard} className="btn-outline flex-1">Hacer otra reserva</button>
              <Link href="/" className="btn-outline flex-1">Volver al inicio</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="relative overflow-hidden bg-jungle-950 pb-10 pt-28 text-white sm:pt-32">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="container-site relative">
          <p className="eyebrow-light">Reserva directa</p>
          <h1 className="mt-3 max-w-3xl text-4xl uppercase leading-[0.92] sm:text-6xl">Arma tu experiencia</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">
            Elige fechas, tu refugio y las actividades. El precio se calcula automáticamente y la disponibilidad se valida en tiempo real.
          </p>

          <ol className="mt-8 grid max-w-2xl grid-cols-3 gap-2">
            {STEPS.map((label, index) => {
              const number = index + 1;
              const done = step > number;
              const active = step === number;
              return (
                <li key={label} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition ${
                      done ? "bg-lime-400 text-ink" : active ? "bg-white text-jungle-950" : "border border-white/20 text-white/40"
                    }`}
                  >
                    {done ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : number}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-[0.12em] sm:text-[10px] ${active ? "text-white" : "text-white/40"}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <section className="py-8 sm:py-12">
        <div className="container-site grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
          <div>
            {step === 1 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl uppercase">1. Fechas y huéspedes</h2>
                    <span className="badge bg-cream-100 text-ink/50">COP</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="wizard-checkin" className="field-label">Llegada</label>
                      <input
                        id="wizard-checkin"
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCheckIn(value);
                          if (value >= checkOut) setCheckOut(addDays(value, 1));
                        }}
                        className="field"
                      />
                    </div>
                    <div>
                      <label htmlFor="wizard-checkout" className="field-label">Salida</label>
                      <input
                        id="wizard-checkout"
                        type="date"
                        min={addDays(checkIn, 1)}
                        value={checkOut}
                        onChange={(event) => setCheckOut(event.target.value)}
                        className="field"
                      />
                    </div>
                    <div>
                      <label htmlFor="wizard-guests" className="field-label">Huéspedes</label>
                      <select
                        id="wizard-guests"
                        value={guests}
                        onChange={(event) => setGuests(Number(event.target.value))}
                        className="field"
                      >
                        {Array.from({ length: maxGuests }, (_, index) => index + 1).map((number) => (
                          <option key={number} value={number}>{number} {number === 1 ? "huésped" : "huéspedes"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!datesValid && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      La fecha de salida debe ser posterior a la llegada y no puedes reservar en el pasado.
                    </p>
                  )}
                  <p className="mt-3 text-[11px] text-ink/40">
                    {nights > 0 ? `${nights} ${nights === 1 ? "noche" : "noches"} · ` : ""}Estadía mínima {settings.booking.minNights} noche{settings.booking.minNights === 1 ? "" : "s"}.
                  </p>
                </div>

                <div>
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-2xl uppercase">2. Elige tu refugio</h2>
                    {availabilityLoading && (
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" /> Consultando
                      </span>
                    )}
                  </div>

                  {availabilityError && (
                    <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{availabilityError}</p>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {(availability ?? []).map((item) => {
                      const isSelected = item.glamping.slug === selectedSlug;
                      return (
                        <article
                          key={item.glamping.id}
                          className={`overflow-hidden rounded-2xl border bg-white transition ${
                            isSelected ? "border-jungle-600 ring-2 ring-lime-400/50" : "border-ink/[0.08] hover:border-jungle-500/40"
                          } ${!item.available ? "opacity-80" : ""}`}
                        >
                          <button
                            type="button"
                            disabled={!canChooseGlamping}
                            onClick={() => {
                              const isMobile = window.matchMedia("(max-width: 1023px)").matches;
                              if (isMobile || !item.available) {
                                setQuickViewItem(item);
                              } else {
                                setSelectedSlug(item.glamping.slug);
                              }
                            }}
                            className="group block w-full text-left disabled:cursor-not-allowed"
                          >
                            <div className="relative aspect-[16/9] overflow-hidden bg-cream-200">
                              <SmartImage
                                src={item.glamping.mainImage || "/images/glamping-bosque.jpg"}
                                alt={item.glamping.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 40vw"
                                className={`object-cover transition duration-700 ${item.available ? "group-hover:scale-105" : "grayscale"}`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                              <div className="absolute left-3 top-3 flex gap-1.5">
                                <span className="badge bg-white/95 text-jungle-700">{item.glamping.capacity} huéspedes</span>
                                {!item.available && <span className="badge bg-red-600 text-white">No disponible</span>}
                                {isSelected && <span className="badge bg-lime-400 text-ink">Elegido</span>}
                              </div>
                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-xl uppercase leading-none text-white">{item.glamping.name}</h3>
                                <p className="mt-1 line-clamp-1 text-[10px] text-white/60">{item.glamping.tagline}</p>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-end justify-between gap-2">
                                <div>
                                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Por noche</p>
                                  <p className="font-display text-xl">{formatCOP(item.quote?.nightlyRate ?? item.glamping.pricePerNight)}</p>
                                </div>
                                {item.quote && (
                                  <div className="text-right">
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">{item.quote.nights} noches</p>
                                    <p className="text-sm font-bold text-jungle-700">{formatCOP(item.quote.total)}</p>
                                  </div>
                                )}
                              </div>
                              {!item.available && item.reason && (
                                <p className="mt-2 text-[11px] leading-4 text-red-600">{item.reason}</p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-1">
                                {item.glamping.amenities.slice(0, 3).map((amenity) => (
                                  <span key={amenity} className="rounded-full bg-cream-100 px-2 py-0.5 text-[9px] text-ink/50">{amenity}</span>
                                ))}
                              </div>
                              <p className="mt-3 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-jungle-700 lg:hidden">
                                <Icon name="image" className="h-3.5 w-3.5" /> Ver fotos y detalles
                              </p>
                            </div>
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {!availabilityLoading && availability && availability.length === 0 && (
                    <p className="mt-4 rounded-xl border border-dashed border-ink/15 py-10 text-center text-sm text-ink/45">
                      No hay alojamientos activos por ahora.
                    </p>
                  )}
                </div>

                {selected && (
                  <div className="flex items-start gap-2 rounded-xl bg-jungle-50 px-4 py-3 text-sm leading-5 text-jungle-800 lg:hidden">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" />
                    <span>
                      Elegiste <strong>{selected.name}</strong>. Revisa el resumen o continúa con tu experiencia.
                    </span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!canContinue}
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="btn-lime w-full sm:w-auto"
                  >
                    Continuar con mi experiencia <Icon name="arrow" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && selected && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl uppercase">Suma aventura y detalles</h2>
                    <span className="badge bg-cream-100 text-ink/50">Opcional</span>
                  </div>
                  <p className="mt-2 text-sm text-ink/55">
                    Los precios de actividades son por persona. Puedes ajustar cantidades o continuar sin extras.
                  </p>

                  <div className="mt-5 space-y-3">
                    {activities.map((activity) => {
                      const quantity = activityQty[activity.id] ?? 0;
                      const max = Math.min(guests, activity.maxPeople ?? guests);
                      const price = getActivityUnitPrice(activity, checkIn);
                      return (
                        <div
                          key={activity.id}
                          className={`flex gap-3 rounded-xl border p-3 transition ${quantity > 0 ? "border-jungle-600/30 bg-jungle-50/40" : "border-ink/[0.07] bg-cream-50"}`}
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                            <SmartImage src={activity.image || "/images/act-senderismo.jpg"} alt={activity.name} fill sizes="80px" className="object-cover" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base uppercase leading-tight">{activity.name}</h3>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/35">
                                  {activity.duration} · {activity.difficulty}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="shrink-0 text-sm font-bold text-jungle-700">{formatCOP(price.unitPrice)}</p>
                                {price.priceKind !== "base" && (
                                  <p className={`text-[9px] font-bold uppercase tracking-wider ${price.priceKind === "holiday" ? "text-yellow-700" : "text-jungle-600"}`}>
                                    {price.priceKind === "holiday" ? "Festivo" : "Fin de semana"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              <span className="text-[9px] text-ink/35">por {activity.priceUnit} · máx. {max}</span>
                              {quantity > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={() => setActivity(activity, quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-sm font-bold hover:bg-white" aria-label={`Quitar ${activity.name}`}>−</button>
                                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                                  <button type="button" onClick={() => setActivity(activity, quantity + 1)} disabled={quantity >= max} className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-sm font-bold hover:bg-white disabled:opacity-30" aria-label={`Agregar ${activity.name}`}>+</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => setActivity(activity, 1)} className="rounded-full bg-ink px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-white transition hover:bg-jungle-700">
                                  Agregar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 sm:p-6">
                  <h2 className="text-2xl uppercase">Servicios adicionales</h2>
                  <p className="mt-2 text-sm text-ink/55">Transporte, comidas o detalles especiales para tu estadía.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                      const quantity = serviceQty[service.id] ?? 0;
                      return (
                        <div key={service.id} className={`rounded-xl border p-4 transition ${quantity > 0 ? "border-jungle-600/30 bg-jungle-50/40" : "border-ink/[0.07] bg-cream-50"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold uppercase leading-tight">{service.name}</h3>
                            <p className="shrink-0 text-sm font-bold text-jungle-700">{formatCOP(service.price)}</p>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink/45">{service.description}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-ink/35">por {service.priceUnit}</span>
                            {quantity > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => setService(service, quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-sm font-bold hover:bg-white" aria-label={`Quitar ${service.name}`}>−</button>
                                <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                                <button type="button" onClick={() => setService(service, quantity + 1)} disabled={quantity >= 20} className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-sm font-bold hover:bg-white disabled:opacity-30" aria-label={`Agregar ${service.name}`}>+</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setService(service, 1)} className="rounded-full bg-ink px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-white transition hover:bg-jungle-700">
                                Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {quoteError && (
                  <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{quoteError}</p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline">
                    <Icon name="chevron-left" className="h-4 w-4" /> Volver
                  </button>
                  <button
                    type="button"
                    disabled={!quote || Boolean(quoteError) || quoteLoading}
                    onClick={() => {
                      setStep(3);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="btn-lime"
                  >
                    {quoteLoading ? "Calculando..." : "Continuar con mis datos"} <Icon name="arrow" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && selected && (
              <form onSubmit={submitBooking} className="space-y-6">
                <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 sm:p-6">
                  <h2 className="text-2xl uppercase">Tus datos</h2>
                  <p className="mt-2 text-sm text-ink/55">Usaremos esta información para confirmar la reserva y contactarte.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-name" className="field-label">Nombre completo *</label>
                      <input id="booking-name" required minLength={2} maxLength={120} value={guest.guestName} onChange={(event) => setGuest({ ...guest, guestName: event.target.value })} className="field" placeholder="Nombre y apellido" />
                    </div>
                    <div>
                      <label htmlFor="booking-email" className="field-label">Correo electrónico *</label>
                      <input id="booking-email" type="email" required value={guest.guestEmail} onChange={(event) => setGuest({ ...guest, guestEmail: event.target.value })} className="field" placeholder="tucorreo@ejemplo.com" />
                    </div>
                    <div>
                      <label htmlFor="booking-phone" className="field-label">WhatsApp / teléfono *</label>
                      <input id="booking-phone" type="tel" required minLength={7} maxLength={30} value={guest.guestPhone} onChange={(event) => setGuest({ ...guest, guestPhone: event.target.value })} className="field" placeholder="+57 300 000 0000" />
                    </div>
                    <div>
                      <label htmlFor="booking-document" className="field-label">Documento</label>
                      <input id="booking-document" maxLength={30} value={guest.guestDocument} onChange={(event) => setGuest({ ...guest, guestDocument: event.target.value })} className="field" placeholder="Cédula o pasaporte" />
                    </div>
                    <div>
                      <label htmlFor="booking-city" className="field-label">Ciudad</label>
                      <input id="booking-city" maxLength={100} value={guest.guestCity} onChange={(event) => setGuest({ ...guest, guestCity: event.target.value })} className="field" placeholder="¿Desde dónde vienes?" />
                    </div>
                    <div>
                      <label htmlFor="booking-notes" className="field-label">Notas o peticiones</label>
                      <input id="booking-notes" maxLength={1000} value={guest.notes} onChange={(event) => setGuest({ ...guest, notes: event.target.value })} className="field" placeholder="Alergias, celebración, llegada tarde..." />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 sm:p-6">
                  <h2 className="text-2xl uppercase">Resumen</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="flex justify-between gap-4"><span className="text-ink/50">Alojamiento</span><span className="text-right font-semibold">{selected.name}</span></p>
                    <p className="flex justify-between gap-4"><span className="text-ink/50">Fechas</span><span className="text-right font-semibold">{formatDate(checkIn)} → {formatDate(checkOut)}</span></p>
                    <p className="flex justify-between gap-4"><span className="text-ink/50">Huéspedes</span><span className="font-semibold">{guests}</span></p>
                    {quote?.activityLines.map((line) => (
                      <p key={line.activityId} className="flex justify-between gap-4">
                        <span className="text-ink/50">
                          {line.name} × {line.quantity}
                          {line.priceLabel && line.priceKind && line.priceKind !== "base" && (
                            <span className="ml-1 text-[10px] text-ink/35">({line.priceLabel})</span>
                          )}
                        </span>
                        <span className="font-semibold">{formatCOP(line.total)}</span>
                      </p>
                    ))}
                    {quote?.serviceLines.map((line) => (
                      <p key={line.serviceId} className="flex justify-between gap-4"><span className="text-ink/50">{line.name} × {line.quantity}</span><span className="font-semibold">{formatCOP(line.total)}</span></p>
                    ))}
                    <p className="flex justify-between gap-4 border-t border-ink/10 pt-2 text-base font-bold"><span>Total</span><span>{formatCOP(quote?.total ?? estimatedTotal)}</span></p>
                    <p className="flex justify-between gap-4 text-jungle-700"><span>Anticipo ({settings.booking.depositPercent}%)</span><span className="font-bold">{formatCOP(quote?.depositRequired ?? 0)}</span></p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/[0.08] bg-white p-4 text-sm leading-6 text-ink/60">
                  <input type="checkbox" required checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-jungle-600" />
                  <span>
                    Acepto las <Link href="/contacto#condiciones" className="font-semibold text-jungle-700 underline underline-offset-2">condiciones de reserva</Link> y autorizo el uso de mis datos para gestionar la reserva.
                  </span>
                </label>

                {submitError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    <p>{submitError}</p>
                    {submitError.toLowerCase().includes("fechas") && (
                      <button type="button" onClick={() => setStep(1)} className="mt-2 font-bold underline">Elegir otras fechas</button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(2)} className="btn-outline">
                    <Icon name="chevron-left" className="h-4 w-4" /> Volver
                  </button>
                  <button type="submit" disabled={submitting || !acceptTerms} className="btn-lime">
                    {submitting ? "Creando reserva..." : "Confirmar reserva"} <Icon name="arrow" className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-[11px] leading-5 text-ink/40">
                  Al confirmar se genera un código de reserva. El pago del anticipo se coordina por WhatsApp; no se cobra nada en este paso.
                </p>
              </form>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.07)]">
              {selected ? (
                <button
                  type="button"
                  onClick={() => selectedItem && setQuickViewItem(selectedItem)}
                  disabled={!selectedItem}
                  className="group relative block aspect-[16/9] w-full overflow-hidden bg-cream-200 text-left"
                  aria-label={`Ver fotos y detalles de ${selected.name}`}
                >
                  <SmartImage src={selected.mainImage || "/images/glamping-bosque.jpg"} alt={selected.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                    <Icon name="image" className="h-3 w-3" /> Fotos
                  </span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-lime-400">Tu refugio</p>
                    <p className="font-display text-xl uppercase text-white">{selected.name}</p>
                  </div>
                </button>
              ) : (
                <div className="flex h-28 items-center justify-center bg-cream-100 text-center text-xs text-ink/40">
                  Selecciona un alojamiento para ver el resumen
                </div>
              )}

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 border-b border-ink/10 pb-4 text-sm">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Llegada</p>
                    <p className="mt-1 font-semibold">{formatDate(checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Salida</p>
                    <p className="mt-1 font-semibold">{formatDate(checkOut)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Noches</p>
                    <p className="mt-1 font-semibold">{nights}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Huéspedes</p>
                    <p className="mt-1 font-semibold">{guests}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  {quote ? (
                    <>
                      <p className="flex justify-between gap-3 text-ink/55">
                        <span>{quote.nights} noches · {quote.rateName}</span>
                        <span>{formatCOP(quote.subtotal)}</span>
                      </p>
                      {quote.activitiesTotal > 0 && (
                        <p className="flex justify-between gap-3 text-ink/55"><span>Actividades</span><span>{formatCOP(quote.activitiesTotal)}</span></p>
                      )}
                      {quote.servicesTotal > 0 && (
                        <p className="flex justify-between gap-3 text-ink/55"><span>Servicios</span><span>{formatCOP(quote.servicesTotal)}</span></p>
                      )}
                      <p className="flex justify-between gap-3 border-t border-ink/10 pt-2 text-base font-bold"><span>Total</span><span>{formatCOP(quote.total)}</span></p>
                      <p className="flex justify-between gap-3 text-xs text-jungle-700"><span>Anticipo requerido</span><span className="font-bold">{formatCOP(quote.depositRequired)}</span></p>
                    </>
                  ) : (
                    <>
                      <p className="flex justify-between gap-3 text-ink/55">
                        <span>{selected ? `${nights} noches` : "Sin alojamiento"}</span>
                        <span>{formatCOP(estimatedTotal)}</span>
                      </p>
                      <p className="text-[11px] text-ink/35">El total final se calcula con las tarifas de cada noche.</p>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-cream-50 p-3 text-[11px] leading-5 text-ink/45">
                  <p className="flex items-center gap-1.5 font-bold text-jungle-700"><Icon name="shield" className="h-3.5 w-3.5" /> Reserva directa y segura</p>
                  <p className="mt-1">Sin intermediarios. Disponibilidad validada contra la base de datos al confirmar.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {quickViewItem && quickViewGlamping && (
        <GlampingQuickView
          key={quickViewItem.glamping.id}
          item={quickViewItem}
          glamping={quickViewGlamping}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={nights}
          guests={guests}
          selected={quickViewSelected}
          onChoose={chooseQuickView}
          onClose={closeQuickView}
        />
      )}
    </>
  );
}
