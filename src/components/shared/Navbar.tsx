"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";
import type { BusinessSettings } from "@/types";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/glampings", label: "Glampings" },
  { href: "/actividades", label: "Aventura" },
  { href: "/galeria", label: "Galería" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar({
  business,
  whatsappUrl,
}: {
  business: BusinessSettings;
  whatsappUrl: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const transparent = isHome && !scrolled && !open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          transparent
            ? "bg-gradient-to-b from-ink/60 to-transparent py-2"
            : "border-b border-ink/[0.07] bg-cream/95 py-1 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl"
        }`}
      >
        <div className="container-site flex h-[76px] items-center justify-between gap-4">
          <Logo light={transparent} compact />

          <nav className="hidden items-center gap-7 lg:flex">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${
                    transparent ? "text-white/80 hover:text-lime-400" : active ? "text-jungle-700" : "text-ink/60 hover:text-jungle-600"
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-lime-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden h-10 w-10 items-center justify-center rounded-full border transition sm:flex ${
                transparent
                  ? "border-white/25 text-white hover:border-lime-400 hover:text-lime-400"
                  : "border-ink/10 text-jungle-700 hover:border-jungle-500 hover:bg-jungle-50"
              }`}
              aria-label="Escribir por WhatsApp"
            >
              <Icon name="whatsapp" className="h-4 w-4" />
            </a>
            <Link href="/reservar" className="btn-lime hidden sm:inline-flex">
              Reservar
            </Link>
            <button
              onClick={() => setOpen((value) => !value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${
                transparent ? "border-white/25 text-white" : "border-ink/10 text-ink"
              }`}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-jungle-950 pt-24 text-white lg:hidden">
          <div className="container-site flex flex-1 flex-col">
            <nav className="flex flex-col divide-y divide-white/10 border-y border-white/10">
              {LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 font-display text-3xl uppercase tracking-wide text-white"
                >
                  <span>{link.label}</span>
                  <span className="text-[10px] font-sans font-bold tracking-widest text-lime-400">0{index + 1}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <Link href="/reservar" onClick={() => setOpen(false)} className="btn-lime w-full">
                Reservar ahora
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="btn-outline-light w-full">
                <Icon name="whatsapp" className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="mt-auto space-y-2 py-8 text-sm text-white/55">
              <p className="flex items-center gap-2">
                <Icon name="pin" className="h-4 w-4 text-lime-400" /> {business.address}
              </p>
              <p className="flex items-center gap-2">
                <Icon name="phone" className="h-4 w-4 text-lime-400" /> {business.phone}
              </p>
              <p className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 text-lime-400" /> {business.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
