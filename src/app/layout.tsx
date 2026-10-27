import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import { SITE_URL } from "@/lib/utils/siteUrl";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Adrenalina Extrema Huila — Glamping y aventura en el Cañón del Magdalena",
    template: "%s — Adrenalina Extrema Huila",
  },
  description:
    "Glamping, rafting, senderismo y naturaleza en el Cañón del Magdalena, sur del Huila. Reserva tu experiencia directamente con disponibilidad en tiempo real.",
  keywords: ["glamping Huila", "aventura Huila", "Cañón del Magdalena", "rafting Huila", "turismo Colombia"],
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Adrenalina Extrema Huila",
    title: "Adrenalina Extrema Huila — Glamping y aventura",
    description: "Aventura, naturaleza y glamping en el Cañón del Magdalena. Reserva en línea.",
    images: ["/images/hero-canon.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrenalina Extrema Huila",
    description: "Glamping y aventura en el Cañón del Magdalena.",
    images: ["/images/hero-canon.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B5D3B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
