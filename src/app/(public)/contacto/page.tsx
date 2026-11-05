import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import ContactForm from "@/components/forms/ContactForm";
import Reveal from "@/components/shared/Reveal";
import Icon from "@/components/ui/Icon";
import { buildWhatsAppUrl, getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/store/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contacto y envíos",
  description:
    "Escríbenos para preguntar por productos, pedidos, envíos o alimentación de tu mascota. Carnalitos, snacks naturales para perros y gatos.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const business = settings.business;
  const store = settings.store;
  const whatsapp = buildWhatsAppUrl(business.whatsapp, "Hola Carnalitos, quiero información sobre sus productos.");

  const contactItems = [
    { icon: "whatsapp" as const, label: "WhatsApp", value: business.phone, href: whatsapp },
    { icon: "phone" as const, label: "Teléfono", value: business.phone, href: `tel:${business.phone.replace(/\s/g, "")}` },
    { icon: "mail" as const, label: "Correo", value: business.email, href: `mailto:${business.email}` },
    { icon: "clock" as const, label: "Horario de atención", value: business.schedule },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos de tu mascota"
        description="¿Dudas sobre ingredientes, porciones o tu pedido? Escríbenos y te ayudamos a elegir lo mejor para tu compañero."
        image="/images/brand/page-hero.svg"
      />

      <section className="py-14 sm:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <Reveal>
            <p className="eyebrow">Estamos cerca</p>
            <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Atención de verdad</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink/60">
              Respondemos por WhatsApp y correo. Si tienes un pedido en curso, incluye el código
              <strong className="text-jungle-800"> CAR-XXXXXXXX</strong> para ayudarte más rápido.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {contactItems.map((item) => {
                const content = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jungle-50 text-jungle-700">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-extrabold uppercase tracking-widest text-ink/35">{item.label}</span>
                      <span className="mt-0.5 block break-words text-sm font-semibold text-ink">{item.value}</span>
                    </span>
                  </>
                );
                return item.href ? (
                  <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl border border-ink/[0.07] bg-white p-4 transition hover:border-jungle-500/40 hover:shadow-sm">
                    {content}
                  </a>
                ) : (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl border border-ink/[0.07] bg-white p-4">
                    {content}
                  </div>
                );
              })}
            </div>

            <div id="ubicacion" className="mt-8 overflow-hidden rounded-2xl border border-ink/10">
              <div className="h-[300px]">
                <iframe
                  title="Ubicación de Carnalitos"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(business.mapQuery)}&z=12&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="pin" className="h-4 w-4 text-jungle-600" /> {business.address}</p>
                <p className="mt-1 text-[11px] text-ink/40">La dirección exacta de recogida se confirma por WhatsApp antes de tu visita.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-jungle-700 transition hover:border-jungle-500 hover:bg-jungle-50" aria-label="Instagram">
                  <Icon name="instagram" className="h-4 w-4" />
                </a>
              )}
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-jungle-700 transition hover:border-jungle-500 hover:bg-jungle-50" aria-label="Facebook">
                  <Icon name="facebook" className="h-4 w-4" />
                </a>
              )}
              {business.tiktok && (
                <a href={business.tiktok} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-jungle-700 transition hover:border-jungle-500 hover:bg-jungle-50" aria-label="TikTok">
                  <Icon name="tiktok" className="h-4 w-4" />
                </a>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <section id="envios" className="border-t border-ink/10 bg-cream-100 py-14 sm:py-20">
        <div className="container-site grid gap-8 lg:grid-cols-3">
          <div>
            <p className="eyebrow">Envíos y pagos</p>
            <h2 className="mt-3 text-3xl uppercase">Sin sorpresas</h2>
            <p className="mt-3 text-sm leading-6 text-ink/55">
              Estas son las condiciones generales de compra. Si algo no está claro, escríbenos antes de pedir.
            </p>
          </div>
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 lg:col-span-2">
            <p className="whitespace-pre-line text-sm leading-7 text-ink/65">{store.terms}</p>
            <div className="mt-5 grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Envío</p>
                <p className="mt-1 text-sm font-bold">{formatCOP(store.shippingCost)}</p>
                <p className="mt-0.5 text-[10px] text-ink/40">Gratis desde {formatCOP(store.freeShippingThreshold)}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Recogida</p>
                <p className="mt-1 text-sm font-bold">Sin costo</p>
                <p className="mt-0.5 text-[10px] text-ink/40">{store.pickupSchedule}</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Pago</p>
                <p className="mt-1 text-sm font-bold">Contraentrega, Nequi o transferencia</p>
                <p className="mt-0.5 text-[10px] text-ink/40">Confirmamos contigo antes de despachar</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
              <Link href="/tienda" className="btn-lime btn-sm">
                Ir a la tienda <Icon name="arrow" className="h-3.5 w-3.5" />
              </Link>
              <Link href="/pedido" className="btn-outline btn-sm">
                <Icon name="package" className="h-3.5 w-3.5" /> Seguir mi pedido
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
