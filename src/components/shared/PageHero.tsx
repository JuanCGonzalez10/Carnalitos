import Image from "next/image";
import type { ReactNode } from "react";

export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative flex min-h-[62vh] items-end overflow-hidden bg-ink pb-16 pt-36 sm:min-h-[66vh] sm:pb-20">
      <Image src={image} alt="" fill priority sizes="100vw" className="animate-ken-burns object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
      <div className="container-site relative">
        <p className="eyebrow-light animate-fade-up">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-5xl uppercase leading-[0.92] text-white sm:text-7xl md:text-[5.4rem]">
          {title}
        </h1>
        {description && <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base">{description}</p>}
        {children}
      </div>
    </header>
  );
}
