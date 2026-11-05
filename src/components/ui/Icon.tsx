import type { SVGProps } from "react";

export type IconName =
  | "calendar"
  | "users"
  | "arrow"
  | "arrow-up"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "menu"
  | "close"
  | "check"
  | "shield"
  | "leaf"
  | "mountain"
  | "water"
  | "tent"
  | "fire"
  | "star"
  | "pin"
  | "phone"
  | "mail"
  | "clock"
  | "wifi"
  | "bed"
  | "bath"
  | "size"
  | "car"
  | "coffee"
  | "sparkles"
  | "download"
  | "plus"
  | "trash"
  | "edit"
  | "eye"
  | "logout"
  | "dashboard"
  | "bookings"
  | "settings"
  | "image"
  | "chart"
  | "search"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "upload"
  | "alert"
  | "card"
  | "receipt"
  | "invoice"
  | "user"
  | "globe"
  | "camera"
  | "horse"
  | "wind"
  | "utensils"
  | "external"
  | "drag"
  | "grid"
  | "home"
  | "ticket"
  | "money"
  | "paw"
  | "cart"
  | "bag"
  | "bone"
  | "truck"
  | "package"
  | "tag"
  | "heart"
  | "minus"
  | "filter";

const PATHS: Record<IconName, string> = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  arrow: "M5 12h14M13 6l6 6-6 6",
  "arrow-up": "M7 17 17 7M7 7h10v10",
  whatsapp: "M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L0 24l6.5-1.7c1.7.9 3.6 1.4 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.4ZM12.2 21.5c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.7 9.7 0 0 1-1.5-5.2c0-5.4 4.4-9.7 9.8-9.7 2.6 0 5 1 6.9 2.9a9.6 9.6 0 0 1 2.8 6.9c0 5.4-4.4 9.8-9.6 9.8Zm5.4-7.3c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 1.9 3 4.6 4.1.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3Z",
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  facebook: "M14 9h4V5h-4c-3.3 0-6 2.7-6 6v3H4v4h4v6h4v-6h4l1-4h-5v-3c0-1.1.9-2 2-2Z",
  tiktok: "M16 3c.5 2.4 2 4.2 4.5 4.5V11c-1.8 0-3.4-.6-4.7-1.6v6.9a6.3 6.3 0 1 1-5.4-6.2v3.5a2.9 2.9 0 1 0 2 2.7V3h3.6Z",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M6 6l12 12M18 6 6 18",
  check: "M20 6 9 17l-5-5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  leaf: "M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9h8v8a9 9 0 0 1-9 9h-1ZM4 21c2-6 6-10 12-13",
  mountain: "m3 20 6-11 4 6 3-4 5 9H3Z",
  water: "M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  tent: "M12 3 2 21h20L12 3ZM12 3v18M7 21l5-9 5 9",
  fire: "M12 22c4 0 7-2.8 7-6.5 0-3-1.5-5.2-4-7.5-.5 2-1.4 3-2.5 3.7.2-3-1.5-5.6-4.5-7.7.2 3.5-3 6-3 11.5C5 19.2 8 22 12 22Z",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2 8 6 8-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5l3 2",
  wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 9a15 15 0 0 1 20 0",
  bed: "M2 4v16M2 10h20v10M2 16h20M6 10V7h5v3M13 10V7h5v3",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M6 19l-1 2M18 19l1 2",
  size: "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6",
  car: "M5 17h14M6 17l-2-5 2-4h12l2 4-2 5M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4 12h16",
  coffee: "M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 9h2a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M15 3v2",
  sparkles: "m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 14l.6 1.4L7 16l-1.4.6L5 18l-.6-1.4L3 16l1.4-.6L5 14Z",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  dashboard: "M3 3h8v8H3V3ZM13 3h8v5h-8V3ZM13 10h8v11h-8V10ZM3 13h8v8H3v-8Z",
  bookings: "M4 5h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM8 3v4M16 3v4M2 11h20M8 15h3M8 18h6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2L14.6 3h-4l-.4 2.5a7.5 7.5 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  image: "M3 3h18v18H3V3Zm0 13 5-5 4 4 3-3 6 6M8 8h.01",
  chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-right": "m9 18 6-6-6-6",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  alert: "M12 3 2 21h20L12 3ZM12 9v5M12 17h.01",
  card: "M3 5h18v14H3V5Zm0 5h18M7 15h3",
  receipt: "M5 2h14v20l-2-1.5L15 22l-2-1.5L11 22l-2-1.5L7 22l-2-1.5V2ZM9 7h6M9 11h6M9 15h4",
  invoice: "M6 2h9l4 4v16H6V2ZM14 2v5h5M9 12h6M9 16h6",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z",
  camera: "M4 7h3l2-3h6l2 3h3v13H4V7Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  horse: "M4 21v-5l3-3 1-5 3-3 4 1 2 4-2 2h3l3 4v5M7 13l4 4M13 10h.01",
  wind: "M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2 2 0 1 1-2 2",
  utensils: "M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11",
  external: "M14 3h7v7M21 3l-9 9M10 5H3v16h16v-7",
  drag: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  grid: "M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z",
  home: "M3 11 12 3l9 8v10H3V11ZM9 21v-7h6v7",
  ticket: "M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Zm11 0v12",
  money: "M3 6h18v12H3V6Zm9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 9h.01M18 15h.01",
  paw: "M6 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-6 5c-3 0-6 2-6 5 0 1.7 1.3 3 3 3 1 0 2-.5 3-.5s2 .5 3 .5c1.7 0 3-1.3 3-3 0-3-3-5-6-5Z",
  cart: "M3 4h2l2.4 11.2A2 2 0 0 0 9.4 17H18a2 2 0 0 0 2-1.6L21.5 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  bag: "M6 8h12l1.5 12.5h-15L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  bone: "M9 12h6M7 9a3 3 0 1 0 0 6M17 9a3 3 0 1 1 0 6M7 9v6M17 9v6",
  truck: "M3 6h11v10H3V6Zm11 3h4l3 3v4h-7V9ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  package: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  tag: "M20.6 13.4 13 21l-9-9V4h8l8.6 8.6a1.4 1.4 0 0 1 0 2ZM7.5 7.5h.01",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z",
  minus: "M5 12h14",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
};

export default function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
  ...props
}: { name: IconName; className?: string; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const filled = ["whatsapp", "instagram", "facebook", "tiktok"].includes(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
