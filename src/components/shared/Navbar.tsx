"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";
import { useCart } from "@/components/store/CartProvider";
import type { BusinessSettings, StoreSettings } from "@/types";
import { formatCOP } from "@/lib/store/format";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar({
  business,
  store,
  whatsappUrl,
}: {
  business: BusinessSettings;
  store: StoreSettings;
  whatsappUrl: string;
}) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="bg-jungle-950 text-white">
        <div className="container-site flex min-h-9 flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 sm:justify-between">
          <span className="flex items-center gap-2">
            <Icon name="truck" className="h-3.5 w-3.5 text-lime-400" />
            Envío gratis desde {formatCOP(store.freeShippingThreshold)}
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <Icon name="leaf" className="h-3.5 w-3.5 text-lime-400" />
            Ingredientes naturales · Hecho en Colombia
          </span>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-white">
            <Icon name="whatsapp" className="h-3.5 w-3.5 text-lime-400" />
            {business.phone}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-cream/95 shadow-[0_2px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl">
        <div className="container-site flex h-[74px] items-center justify-between gap-4">
          <Logo compact />

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${
                    active ? "text-jungle-800" : "text-ink/55 hover:text-jungle-700"
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-lime-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-jungle-700 transition hover:border-jungle-500 hover:bg-jungle-50 sm:flex"
              aria-label="Escribir por WhatsApp"
            >
              <Icon name="whatsapp" className="h-4 w-4" />
            </a>

            <Link
              href="/carrito"
              className="relative flex h-10 items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 text-jungle-800 transition hover:border-jungle-500"
              aria-label={`Carrito de compras${ready && count > 0 ? `, ${count} productos` : ""}`}
            >
              <Icon name="cart" className="h-4 w-4" />
              <span className="hidden text-[10px] font-extrabold uppercase tracking-widest sm:inline">Carrito</span>
              {ready && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1 text-[10px] font-extrabold text-ink">
                  {count}
                </span>
              )}
            </Link>

            <Link href="/tienda" className="btn-lime hidden md:inline-flex">
              Comprar <Icon name="arrow" className="h-4 w-4" />
            </Link>

            <button
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-cream pt-[110px] lg:hidden">
          <div className="container-site flex flex-1 flex-col">
            <nav className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
              {LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 font-display text-3xl uppercase tracking-wide text-jungle-950"
                >
                  <span>{link.label}</span>
                  <span className="font-sans text-[10px] font-bold tracking-widest text-jungle-600">0{index + 1}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <Link href="/tienda" onClick={() => setOpen(false)} className="btn-lime w-full">
                Ir a la tienda <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="/carrito" onClick={() => setOpen(false)} className="btn-outline w-full">
                <Icon name="cart" className="h-4 w-4" /> Ver carrito {ready && count > 0 ? `(${count})` : ""}
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="btn-jungle w-full">
                <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="mt-auto space-y-2 py-8 text-sm text-ink/55">
              <p className="flex items-center gap-2">
                <Icon name="pin" className="h-4 w-4 text-jungle-600" /> {business.address}
              </p>
              <p className="flex items-center gap-2">
                <Icon name="phone" className="h-4 w-4 text-jungle-600" /> {business.phone}
              </p>
              <p className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 text-jungle-600" /> {business.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
