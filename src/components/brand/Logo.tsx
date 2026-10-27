/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function LogoMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src="/icon.png"
      alt="Adrenalina Extrema"
      width={64}
      height={64}
      className={`object-contain ${className}`}
      loading="eager"
    />
  );
}

export default function Logo({
  light = false,
  compact = false,
  size = "normal",
  className = "",
  imageClassName = "",
}: {
  light?: boolean;
  compact?: boolean;
  size?: "compact" | "normal" | "large" | "xl";
  className?: string;
  imageClassName?: string;
}) {
  const sizeClasses = {
    compact: "h-11 sm:h-12 max-h-[52px]",
    normal: "h-14 sm:h-16 max-h-[64px]",
    large: "h-20 sm:h-24 max-h-[96px]",
    xl: "h-28 sm:h-32 max-h-[130px]",
  };

  const chosenSize = compact ? sizeClasses.compact : (sizeClasses[size] ?? sizeClasses.normal);

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 transition-all ${className}`}
      aria-label="Adrenalina Extrema Huila — Inicio"
    >
      <img
        src="/logo-adrenalina.png"
        alt="Adrenalina Extrema Huila"
        width={1024}
        height={642}
        className={`${chosenSize} w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
          light ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]" : "drop-shadow-sm"
        } ${imageClassName}`}
        style={{ aspectRatio: "1024 / 642", minWidth: "80px" }}
        loading="eager"
      />
    </Link>
  );
}


