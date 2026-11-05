import Image from "next/image";
import Link from "next/link";

const MARK_SRC = "/images/brand/logo-mark.png";

export function LogoMark({
  className = "h-11 w-11",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-jungle-900/10 ${className}`}
    >
      <Image
        src={MARK_SRC}
        alt=""
        fill
        priority={priority}
        sizes="96px"
        className="scale-[1.12] object-contain"
      />
    </span>
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
  const markSizes = {
    compact: "h-10 w-10",
    normal: "h-12 w-12",
    large: "h-16 w-16",
    xl: "h-20 w-20",
  };
  const titleSizes = {
    compact: "text-[22px]",
    normal: "text-[27px]",
    large: "text-[34px]",
    xl: "text-[44px]",
  };
  const chosenSize = compact ? "compact" : size;

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 transition-all ${className}`}
      aria-label="Carnalitos — Inicio"
    >
      <span className={`${markSizes[chosenSize]} ${imageClassName} transition-transform duration-300 group-hover:-rotate-6`}>
        <LogoMark className="h-full w-full" priority={chosenSize === "compact"} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`brand-wordmark ${titleSizes[chosenSize]}`}>CARNALITOS</span>
        {!compact && (
          <span
            className={`mt-1.5 text-[10px] font-bold leading-none ${
              light ? "text-white/65" : "text-ink/55"
            }`}
          >
            Si a ti te gusta, a él también
          </span>
        )}
      </span>
    </Link>
  );
}
