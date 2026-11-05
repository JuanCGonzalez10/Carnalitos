import Image, { type ImageProps } from "next/image";

export default function SmartImage({ alt = "", ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized =
    src.startsWith("/api/media") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.endsWith(".svg");
  return <Image {...props} alt={alt} unoptimized={unoptimized || props.unoptimized} />;
}
