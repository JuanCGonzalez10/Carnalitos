import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className={light ? "eyebrow-light" : "eyebrow"}>{eyebrow}</p>}
      <h2 className={`section-title mt-4 text-balance ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      {description && (
        <p className={`mt-5 text-[15px] leading-7 ${light ? "text-white/65" : "text-ink/60"} ${align === "center" ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
}
