import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";
import type { BusinessSettings, StoreSettings } from "@/types";
import { buildWhatsAppUrl } from "@/lib/settings";
import { formatCOP } from "@/lib/store/format";

export default function Footer({
  business,
  store,
}: {
  business: BusinessSettings;
  store: StoreSettings;
}) {
  const whatsapp = buildWhatsAppUrl(business.whatsapp, "Hola Carnalitos, quiero información sobre sus productos.");
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-jungle-950 text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="container-site relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo light size="large" />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">{business.description}</p>
            <div className="mt-7 flex gap-2.5">
              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-lime-400 hover:text-lime-400">
                  <Icon name="instagram" className="h-4 w-4" />
                </a>
              )}
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-lime-400 hover:text-lime-400">
                  <Icon name="facebook" className="h-4 w-4" />
                </a>
              )}
              {business.tiktok && (
                <a href={business.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-lime-400 hover:text-lime-400">
                  <Icon name="tiktok" className="h-4 w-4" />
                </a>
              )}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-ink transition hover:bg-lime-300">
                <Icon name="whatsapp" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:pl-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-400">Tienda</p>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li><Link href="/tienda" className="transition hover:text-white">Todos los productos</Link></li>
                <li><Link href="/tienda?category=snacks-naturales" className="transition hover:text-white">Snacks naturales</Link></li>
                <li><Link href="/tienda?category=comida-saludable" className="transition hover:text-white">Comida saludable</Link></li>
                <li><Link href="/tienda?category=gatos" className="transition hover:text-white">Para gatos</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-400">Ayuda</p>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li><Link href="/contacto" className="transition hover:text-white">Contacto</Link></li>
                <li><Link href="/pedido" className="transition hover:text-white">Seguir mi pedido</Link></li>
                <li><Link href="/nosotros" className="transition hover:text-white">Nuestra historia</Link></li>
                <li><Link href="/contacto#envios" className="transition hover:text-white">Envíos y entregas</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-400">Contacto</p>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /> {business.address}</li>
                <li><a href={`tel:${business.phone.replace(/\s/g, "")}`} className="flex gap-2.5 transition hover:text-white"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /> {business.phone}</a></li>
                <li><a href={`mailto:${business.email}`} className="flex gap-2.5 transition hover:text-white"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /> {business.email}</a></li>
                <li className="flex gap-2.5"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /> {business.schedule}</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="font-display text-2xl uppercase text-white">Compra directa</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Envío gratis en compras desde {formatCOP(store.freeShippingThreshold)}. Pago contraentrega en Medellín.
              </p>
              <Link href="/tienda" className="btn-lime mt-5 w-full">Comprar ahora</Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60 transition hover:text-lime-400">
                <Icon name="whatsapp" className="h-4 w-4" /> Escríbenos
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {business.name}. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-5">
            <span>Precios en pesos colombianos (COP)</span>
            <Link href="/admin/login" className="transition hover:text-white">Acceso administrador</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
