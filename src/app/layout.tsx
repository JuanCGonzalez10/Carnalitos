import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { SITE_URL } from "@/lib/utils/siteUrl";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Carnalitos — Snacks y comida saludable para mascotas",
    template: "%s — Carnalitos",
  },
  description:
    "Snacks naturales, comida saludable y premios para perros y gatos. Ingredientes reales, lotes pequeños y entregas exclusivas en Medellín.",
  keywords: [
    "snacks para perros",
    "comida saludable para mascotas",
    "premios para gatos",
    "snacks naturales",
    "Carnalitos Colombia",
  ],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Carnalitos",
    title: "Carnalitos — Si a ti te gusta, a él también",
    description:
      "Snacks y comida saludable para perros y gatos, hechos con ingredientes reales y sin conservantes artificiales.",
    images: ["/images/brand/og-carnalitos.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carnalitos",
    description: "Snacks y comida saludable para mascotas.",
    images: ["/images/brand/og-carnalitos.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#3AB882",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${baloo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
