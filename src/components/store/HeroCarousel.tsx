"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import SmartImage from "@/components/ui/SmartImage";
import { formatCOP } from "@/lib/store/format";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  image: string;
  imageAlt: string;
  align?: "left" | "right";
  primary: { href: string; label: string };
  secondary: { href: string; label: string; external?: boolean };
  chips: { icon: IconName; label: string }[];
};

export default function HeroCarousel({
  freeShippingThreshold,
  city,
  whatsappUrl,
}: {
  freeShippingThreshold: number;
  city: string;
  whatsappUrl: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const slides: Slide[] = [
    {
      id: "bienvenida",
      eyebrow: "Snacks naturales · Hechos en Medellín",
      title: "¡Hola, humano!",
      highlight: "Aquí están los snacks que mueven la colita.",
      text: "Premios y comida con ingredientes de verdad, horneados en lotes pequeños en Medellín. Sin conservantes, sin colorantes y con mucho cariño.",
      image: "/images/carousel/hero-1.jpg",
      imageAlt: "Perrito husky chef de Carnalitos en la cocina con snacks horneados naturales",
      align: "right",
      primary: { href: "/tienda", label: "Comprar ahora" },
      secondary: { href: "/nosotros", label: "Conoce Carnalitos" },
      chips: [
        { icon: "truck", label: `Envío gratis desde ${formatCOP(freeShippingThreshold)}` },
        { icon: "leaf", label: "100% natural" },
        { icon: "pin", label: city || "Medellín" },
      ],
    },
    {
      id: "celebracion",
      eyebrow: "Celebraciones y consentidera",
      title: "Cada día es motivo",
      highlight: "para celebrar juntos.",
      text: "Tortas, galletas y premios artesanales para celebrar la vida de tus carnalitos. Porque consentirlos con comida real es el mejor regalo.",
      image: "/images/carousel/hero-2.jpg",
      imageAlt: "Perritos y gatitos celebrando un cumpleaños con torta y premios naturales Carnalitos",
      primary: { href: "/tienda?sort=featured", label: "Ver favoritos" },
      secondary: { href: whatsappUrl, label: "Pedidos especiales", external: true },
      chips: [
        { icon: "heart", label: "Para consentir" },
        { icon: "star", label: "Recetas artesanales" },
        { icon: "paw", label: "Perros y gatos" },
      ],
    },
    {
      id: "gatos",
      eyebrow: "Cocina felina · Paladares exigentes",
      title: "Recetas irresistibles,",
      highlight: "también para tu gato.",
      text: "Salmón fresco, atún y premios crujientes sin sal ni químicos. Texturas y aromas irresistibles pensados exclusivamente para su nutrición y digestión.",
      image: "/images/carousel/hero-3.jpg",
      imageAlt: "Gatito chef saboreando recetas naturales de salmón y premios Carnalitos",
      primary: { href: "/tienda?category=para-gatos", label: "Menú felino" },
      secondary: { href: "/tienda", label: "Toda la tienda" },
      chips: [
        { icon: "shield", label: "Sin conservantes" },
        { icon: "utensils", label: "Proteína real" },
        { icon: "heart", label: "Digestión sana" },
      ],
    },
    {
      id: "cocina-medellin",
      eyebrow: "De nuestra cocina en Medellín a tu casa",
      title: "Comida honesta,",
      highlight: "ingredientes que se ven.",
      text: "Calabaza, zanahoria, proteína de calidad y avena integral. Entregas en Medellín en 24 a 48 horas con pago contraentrega.",
      image: "/images/carousel/hero-4.jpg",
      imageAlt: "Ingredientes frescos y naturales en la mesa de preparación de Carnalitos",
      align: "right",
      primary: { href: "/tienda", label: "Armar mi pedido" },
      secondary: { href: whatsappUrl, label: "Hablar por WhatsApp", external: true },
      chips: [
        { icon: "truck", label: "Entrega en 24 a 48 h" },
        { icon: "bag", label: "Contraentrega en Medellín" },
        { icon: "pin", label: "Medellín, Colombia" },
      ],
    },
  ];

  const total = slides.length;

  function go(direction: number) {
    setIndex((current) => (current + direction + total) % total);
  }

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, index, total]);

  return (
    <section
      className="relative overflow-hidden bg-black"
      aria-roledescription="carrusel"
      aria-label="Presentación de Carnalitos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        if (Math.abs(delta) > 48) go(delta > 0 ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-luxe motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={slide.id}
              className="relative flex min-h-[75vh] w-full shrink-0 items-center overflow-hidden sm:min-h-[82vh] lg:min-h-[88vh]"
              aria-hidden={!active}
              inert={!active}
              aria-roledescription="diapositiva"
              aria-label={`${slideIndex + 1} de ${total}`}
            >
              {/* Imagen ocupando el 100% del carrusel */}
              <div className="absolute inset-0 z-0">
                <SmartImage
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                {/* Degradado neutro sutil para legibilidad de textos, sin cuadros ni tintes verdes */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent ${
                    slide.align === "right"
                      ? "lg:bg-gradient-to-l lg:from-black/70 lg:via-black/25 lg:to-transparent"
                      : "lg:bg-gradient-to-r lg:from-black/65 lg:via-black/20 lg:to-transparent"
                  }`}
                />
              </div>

              {/* Contenido tipográfico flotante y limpio, sin recuadro */}
              <div className="container-site relative z-10 w-full py-16 sm:py-20 lg:py-24">
                <div className={`max-w-xl text-white ${slide.align === "right" ? "ml-auto" : ""}`}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-lime-400 shadow-md backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                    {slide.eyebrow}
                  </div>

                  <h1 className="mt-4 text-balance font-display text-4xl uppercase leading-[0.92] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:text-6xl lg:text-7xl">
                    {slide.title}
                    <br />
                    <span className="text-lime-400 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                      {slide.highlight}
                    </span>
                  </h1>

                  <p className="mt-4 max-w-lg text-[15px] leading-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] sm:text-base">
                    {slide.text}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link href={slide.primary.href} className="btn-lime shadow-xl">
                      {slide.primary.label} <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                    {slide.secondary.external ? (
                      <a
                        href={slide.secondary.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/45 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-xl backdrop-blur-sm transition hover:bg-white hover:text-ink"
                      >
                        <Icon name="whatsapp" className="h-4 w-4 text-lime-400" /> {slide.secondary.label}
                      </a>
                    ) : (
                      <Link
                        href={slide.secondary.href}
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/45 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-xl backdrop-blur-sm transition hover:bg-white hover:text-ink"
                      >
                        {slide.secondary.label}
                      </Link>
                    )}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    {slide.chips.map((chip) => (
                      <span
                        key={chip.label}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3.5 py-1.5 shadow-md backdrop-blur-sm"
                      >
                        <Icon name={chip.icon} className="h-3.5 w-3.5 text-lime-400" />
                        {chip.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles de navegación del carrusel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 sm:bottom-7">
        <div className="container-site flex items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-black/50 p-2 shadow-xl backdrop-blur-md">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(slideIndex)}
                aria-label={`Ir a la diapositiva ${slideIndex + 1}: ${slide.title} ${slide.highlight}`}
                aria-current={slideIndex === index}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  slideIndex === index ? "w-8 bg-lime-400" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-white/20 bg-black/50 px-3.5 py-2 text-[10px] font-extrabold tracking-[0.18em] text-lime-400 shadow-xl backdrop-blur-md sm:block">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Diapositiva anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-xl backdrop-blur-md transition hover:bg-lime-400 hover:text-ink"
            >
              <Icon name="chevron-left" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Diapositiva siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-xl backdrop-blur-md transition hover:bg-lime-400 hover:text-ink"
            >
              <Icon name="chevron-right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
