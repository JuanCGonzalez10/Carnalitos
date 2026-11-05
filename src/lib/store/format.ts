import type { CartItem, CartTotals, StoreSettings } from "@/types";

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(Number.isFinite(value) ? value : 0);
}

export function discountPercent(price: number, compareAtPrice: number | null | undefined): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function shippingFor(subtotal: number, store: StoreSettings, deliveryMethod: "delivery" | "pickup" = "delivery"): number {
  if (deliveryMethod === "pickup") return 0;
  if (store.freeShippingThreshold > 0 && subtotal >= store.freeShippingThreshold) return 0;
  return store.shippingCost;
}

export function cartTotals(
  items: CartItem[],
  store: StoreSettings,
  deliveryMethod: "delivery" | "pickup" = "delivery",
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = items.length === 0 ? 0 : shippingFor(subtotal, store, deliveryMethod);
  const freeShippingRemaining =
    store.freeShippingThreshold > 0 ? Math.max(0, store.freeShippingThreshold - subtotal) : 0;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
