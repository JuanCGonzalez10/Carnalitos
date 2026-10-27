"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageField from "@/components/admin/ImageField";
import GlampingImagesManager from "@/components/admin/GlampingImagesManager";
import RatesManager from "@/components/admin/RatesManager";
import BlocksManager from "@/components/admin/BlocksManager";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { BlockedDate, Glamping, GlampingImage, GlampingRate } from "@/types";

type Tab = "info" | "photos" | "rates" | "preview";

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function GlampingEditor({
  glamping,
  images,
  rates,
  blocks,
}: {
  glamping: Glamping | null;
  images: GlampingImage[];
  rates: GlampingRate[];
  blocks: BlockedDate[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [imageList, setImageList] = useState(images);
  const [form, setForm] = useState({
    name: glamping?.name ?? "",
    slug: glamping?.slug ?? "",
    tagline: glamping?.tagline ?? "",
    shortDescription: glamping?.shortDescription ?? "",
    description: glamping?.description ?? "",
    pricePerNight: glamping ? String(glamping.pricePerNight) : "",
    weekendPricePerNight: glamping?.weekendPricePerNight != null ? String(glamping.weekendPricePerNight) : "",
    holidayPricePerNight: glamping?.holidayPricePerNight != null ? String(glamping.holidayPricePerNight) : "",
    capacity: glamping ? String(glamping.capacity) : "2",
    bedrooms: glamping ? String(glamping.bedrooms) : "1",
    bathrooms: glamping ? String(glamping.bathrooms) : "1",
    sizeM2: glamping?.sizeM2 ? String(glamping.sizeM2) : "",
    location: glamping?.location ?? "Cañón del Magdalena, Huila",
    amenitiesText: (glamping?.amenities ?? []).join("\n"),
    includesText: (glamping?.includes ?? []).join("\n"),
    conditions: glamping?.conditions ?? "",
    mainImage: glamping?.mainImage ?? "",
    active: glamping?.active ?? true,
    featured: glamping?.featured ?? false,
    sortOrder: glamping ? String(glamping.sortOrder) : "0",
  });

  const previewImage = form.mainImage || glamping?.mainImage || "/images/glamping-bosque.jpg";
  const amenities = splitLines(form.amenitiesText);
  const includes = splitLines(form.includesText);
  const canManageChildren = Boolean(glamping);

  useEffect(() => {
    setImageList(images);
  }, [images]);

  function handleImagesChange(next: GlampingImage[]) {
    setImageList(next);
    const main = next.find((image) => image.isMain) ?? next[0];
    setForm((previous) => ({ ...previous, mainImage: main?.url ?? "" }));
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug.trim() || undefined,
        tagline: form.tagline,
        shortDescription: form.shortDescription,
        description: form.description,
        pricePerNight: Number(form.pricePerNight),
        weekendPricePerNight: form.weekendPricePerNight === "" ? null : Number(form.weekendPricePerNight),
        holidayPricePerNight: form.holidayPricePerNight === "" ? null : Number(form.holidayPricePerNight),
        capacity: Number(form.capacity),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sizeM2: form.sizeM2 === "" ? null : Number(form.sizeM2),
        location: form.location,
        amenities: amenities,
        includes: includes,
        conditions: form.conditions,
        mainImage: form.mainImage,
        active: form.active,
        featured: form.featured,
        sortOrder: Number(form.sortOrder),
      };
      const response = await fetch(glamping ? `/api/admin/glampings/${glamping.id}` : "/api/admin/glampings", {
        method: glamping ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el glamping.");
      setMessage({ type: "ok", text: glamping ? "Cambios guardados." : "Glamping creado. Ahora puedes agregar fotos y tarifas." });
      if (!glamping) {
        router.replace(`/admin/glampings/${data.glamping.id}`);
      }
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el glamping." });
    } finally {
      setSaving(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string; icon: "edit" | "image" | "calendar" | "eye"; disabled?: boolean }> = [
    { id: "info", label: "Información", icon: "edit" },
    { id: "photos", label: `Fotos (${imageList.length})`, icon: "image", disabled: !canManageChildren },
    { id: "rates", label: "Tarifas y fechas", icon: "calendar", disabled: !canManageChildren },
    { id: "preview", label: "Vista previa", icon: "eye" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/35">
            <Link href="/admin/glampings" className="transition hover:text-jungle-700">Glampings</Link>
            <span>/</span>
            <span className="text-ink/60">{glamping ? "Editar" : "Nuevo"}</span>
          </nav>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">{glamping ? glamping.name : "Nuevo glamping"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {glamping && (
            <Link href={`/glampings/${glamping.slug}`} target="_blank" className="btn-outline btn-sm">
              <Icon name="external" className="h-3.5 w-3.5" /> Ver publicado
            </Link>
          )}
          <button type="button" onClick={() => void save()} disabled={saving} className="btn-jungle btn-sm">
            {saving ? "Guardando..." : "Guardar cambios"} <Icon name="check" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}

      <div className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-ink/10 pb-px">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setTab(item.id)}
            disabled={item.disabled}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition ${
              tab === item.id
                ? "border-jungle-700 text-jungle-700"
                : item.disabled
                  ? "border-transparent text-ink/20"
                  : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
            title={item.disabled ? "Guarda el glamping primero" : undefined}
          >
            <Icon name={item.icon} className="h-3.5 w-3.5" /> {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div>
          {tab === "info" && (
            <form id="glamping-form" onSubmit={save} className="space-y-5">
              <section className="admin-card">
                <h2 className="text-xl uppercase">Datos básicos</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="g-name" className="admin-label">Nombre *</label>
                    <input id="g-name" required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" placeholder="Domo Mirador del Cañón" />
                  </div>
                  <div>
                    <label htmlFor="g-slug" className="admin-label">Slug (URL)</label>
                    <input id="g-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="admin-input font-mono text-[12px]" placeholder="domo-mirador-del-canon" />
                    <p className="mt-1 text-[10px] text-ink/35">Si lo dejas vacío se genera desde el nombre.</p>
                  </div>
                  <div>
                    <label htmlFor="g-location" className="admin-label">Ubicación</label>
                    <input id="g-location" maxLength={200} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="admin-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="g-tagline" className="admin-label">Frase corta</label>
                    <input id="g-tagline" maxLength={160} value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} className="admin-input" placeholder="Amanecer frente a la inmensidad" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="g-short" className="admin-label">Descripción corta (catálogo)</label>
                    <textarea id="g-short" maxLength={300} rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} className="admin-input resize-y" />
                    <p className="mt-1 text-right text-[10px] text-ink/30">{form.shortDescription.length}/300</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="g-description" className="admin-label">Descripción completa</label>
                    <textarea id="g-description" maxLength={5000} rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="admin-textarea" />
                  </div>
                </div>
              </section>

              <section className="admin-card">
                <h2 className="text-xl uppercase">Capacidad y precio</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="g-price" className="admin-label">Precio base / noche (COP) *</label>
                    <input id="g-price" type="number" required min={0} step={1000} value={form.pricePerNight} onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })} className="admin-input" placeholder="420000" />
                  </div>
                  <div>
                    <label htmlFor="g-weekend-price" className="admin-label">Fin de semana / noche (COP)</label>
                    <input id="g-weekend-price" type="number" min={0} step={1000} value={form.weekendPricePerNight} onChange={(event) => setForm({ ...form, weekendPricePerNight: event.target.value })} className="admin-input" placeholder="Si vacío, usa la base" />
                    <p className="mt-1 text-[10px] text-ink/35">Sábado y domingo.</p>
                  </div>
                  <div>
                    <label htmlFor="g-holiday-price" className="admin-label">Festivo / noche (COP)</label>
                    <input id="g-holiday-price" type="number" min={0} step={1000} value={form.holidayPricePerNight} onChange={(event) => setForm({ ...form, holidayPricePerNight: event.target.value })} className="admin-input" placeholder="Si vacío, usa la base" />
                    <p className="mt-1 text-[10px] text-ink/35">Festivos colombianos.</p>
                  </div>
                  <div>
                    <label htmlFor="g-capacity" className="admin-label">Capacidad máxima *</label>
                    <input id="g-capacity" type="number" required min={1} max={30} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="g-size" className="admin-label">Tamaño (m²)</label>
                    <input id="g-size" type="number" min={0} max={10000} value={form.sizeM2} onChange={(event) => setForm({ ...form, sizeM2: event.target.value })} className="admin-input" placeholder="32" />
                  </div>
                  <div>
                    <label htmlFor="g-bedrooms" className="admin-label">Habitaciones</label>
                    <input id="g-bedrooms" type="number" min={0} max={20} value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="g-bathrooms" className="admin-label">Baños</label>
                    <input id="g-bathrooms" type="number" min={0} max={20} value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label htmlFor="g-sort" className="admin-label">Orden en el catálogo</label>
                    <input id="g-sort" type="number" min={0} max={999} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="admin-input" />
                  </div>
                </div>
                <p className="mt-4 rounded-lg bg-jungle-50 px-3 py-2 text-[11px] leading-5 text-jungle-800">
                  Precio por noche: si una noche coincide con una temporada especial se usa esa tarifa. Si no, se aplica la tarifa de festivo, luego la de fin de semana y por último la base. Deja un campo vacío para usar la tarifa base. También puedes editar estas tres tarifas desde la pestaña <strong>Tarifas y fechas</strong>.
                </p>
              </section>

              <section className="admin-card">
                <h2 className="text-xl uppercase">Comodidades e inclusiones</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="g-amenities" className="admin-label">Comodidades (una por línea)</label>
                    <textarea id="g-amenities" rows={7} value={form.amenitiesText} onChange={(event) => setForm({ ...form, amenitiesText: event.target.value })} className="admin-textarea" placeholder={"Cama king\nBaño privado\nTerraza panorámica"} />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {amenities.slice(0, 8).map((item) => (
                        <span key={item} className="rounded-full bg-cream-100 px-2 py-1 text-[9px] text-ink/50">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="g-includes" className="admin-label">Incluido en la estadía (una por línea)</label>
                    <textarea id="g-includes" rows={7} value={form.includesText} onChange={(event) => setForm({ ...form, includesText: event.target.value })} className="admin-textarea" placeholder={"Desayuno campestre\nCaminata guiada\nParqueadero"} />
                  </div>
                </div>
              </section>

              <section className="admin-card">
                <h2 className="text-xl uppercase">Condiciones y foto principal</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="g-conditions" className="admin-label">Condiciones del alojamiento</label>
                    <textarea id="g-conditions" maxLength={2000} rows={4} value={form.conditions} onChange={(event) => setForm({ ...form, conditions: event.target.value })} className="admin-textarea" placeholder="Tarifa para 2 personas. Check-in 3:00 p. m. ..." />
                  </div>
                  <ImageField
                    value={form.mainImage}
                    onChange={(url) => setForm({ ...form, mainImage: url })}
                    label="Foto principal"
                    hint="También puedes administrar todas las fotos en la pestaña Fotos."
                  />
                </div>
              </section>
            </form>
          )}

          {tab === "photos" && glamping && (
            <div className="admin-card">
              <GlampingImagesManager
                glampingId={glamping.id}
                glampingName={glamping.name}
                initial={imageList}
                onImagesChange={handleImagesChange}
              />
            </div>
          )}

          {tab === "rates" && glamping && (
            <div className="space-y-5">
              <div className="admin-card">
                <RatesManager
                  glampingId={glamping.id}
                  initial={rates}
                  basePrice={Number(form.pricePerNight) || 0}
                  weekendPricePerNight={form.weekendPricePerNight === "" ? null : Number(form.weekendPricePerNight)}
                  holidayPricePerNight={form.holidayPricePerNight === "" ? null : Number(form.holidayPricePerNight)}
                  onPricesSaved={(prices) =>
                    setForm((previous) => ({
                      ...previous,
                      pricePerNight: String(prices.pricePerNight),
                      weekendPricePerNight: prices.weekendPricePerNight == null ? "" : String(prices.weekendPricePerNight),
                      holidayPricePerNight: prices.holidayPricePerNight == null ? "" : String(prices.holidayPricePerNight),
                    }))
                  }
                />
              </div>
              <div className="admin-card">
                <BlocksManager glampingId={glamping.id} initial={blocks} />
              </div>
            </div>
          )}

          {tab === "preview" && (
            <div className="admin-card">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl uppercase">Vista previa publicada</h2>
                  <p className="mt-1 text-sm text-ink/50">Así se ve la ficha con los datos guardados. Los cambios sin guardar no se reflejan.</p>
                </div>
                {glamping && (
                  <Link href={`/glampings/${glamping.slug}`} target="_blank" className="btn-outline btn-sm shrink-0">
                    <Icon name="external" className="h-3.5 w-3.5" /> Abrir en nueva pestaña
                  </Link>
                )}
              </div>
              {glamping ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-ink/10">
                  <iframe title="Vista previa del glamping" src={`/glampings/${glamping.slug}`} className="h-[680px] w-full bg-white" />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/40">
                  Guarda el glamping para habilitar la vista previa publicada.
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="admin-card">
            <h2 className="text-lg uppercase">Publicación</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-ink/10 p-3">
                <span>
                  <span className="block text-[11px] font-bold">Publicado en el sitio</span>
                  <span className="block text-[10px] text-ink/35">Los ocultos no se pueden reservar.</span>
                </span>
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-ink/10 p-3">
                <span>
                  <span className="block text-[11px] font-bold">Destacar en inicio</span>
                  <span className="block text-[10px] text-ink/35">Aparece en la selección principal.</span>
                </span>
                <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="h-4 w-4 accent-jungle-600" />
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            <div className="relative aspect-[4/3] bg-cream-200">
              <SmartImage src={previewImage} alt={form.name || "Vista previa"} fill sizes="(max-width: 1280px) 100vw, 380px" className="object-cover" />
              <div className="absolute left-3 top-3 flex gap-1.5">
                <span className="badge bg-white/95 text-jungle-700">Glamping</span>
                {form.featured && <span className="badge bg-lime-400 text-ink">Destacado</span>}
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-lime-400">{form.tagline || "Tu refugio"}</p>
                <p className="font-display text-xl uppercase leading-none">{form.name || "Nombre del glamping"}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-[11px] leading-5 text-ink/50">{form.shortDescription || "Descripción corta del alojamiento."}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {amenities.slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full bg-cream-100 px-2 py-0.5 text-[9px] text-ink/50">{item}</span>
                ))}
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-ink/[0.07] pt-3">
                <div>
                  <p className="text-[8px] font-extrabold uppercase tracking-widest text-ink/35">Desde / noche</p>
                  <p className="font-display text-lg">{formatCOP(Number(form.pricePerNight) || 0)}</p>
                </div>
                <span className="text-[9px] font-bold text-ink/40">{form.capacity || 0} huéspedes</span>
              </div>
            </div>
          </div>

          {includes.length > 0 && (
            <div className="rounded-xl border border-ink/10 bg-white p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Incluye</p>
              <ul className="mt-2 space-y-1 text-[11px] text-ink/55">
                {includes.slice(0, 5).map((item) => (
                  <li key={item} className="flex items-start gap-1.5"><Icon name="check" className="mt-0.5 h-3 w-3 shrink-0 text-jungle-600" /> {item}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="button" onClick={() => void save()} disabled={saving} className="btn-jungle w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </aside>
      </div>
    </div>
  );
}
