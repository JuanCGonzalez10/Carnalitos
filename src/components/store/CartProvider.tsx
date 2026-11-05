"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import type { CartItem } from "@/types";

const STORAGE_KEY = "carnalitos_cart_v1";

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sanitize(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      productId: String(item.productId ?? ""),
      slug: String(item.slug ?? ""),
      name: String(item.name ?? ""),
      price: Number(item.price) || 0,
      image: String(item.image ?? ""),
      unit: String(item.unit ?? "unidad"),
      stock: Number(item.stock) || 0,
      quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
    }))
    .filter((item) => item.productId && item.name);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El carrito vive en localStorage: solo puede leerse después de montar,
  // porque el HTML del servidor no tiene acceso al almacenamiento del navegador.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(sanitize(JSON.parse(raw)));
    } catch {
      // Carrito corrupto: se ignora y empieza vacío.
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento disponible (modo privado estricto).
    }
  }, [items, ready]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function notify(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }

  function add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const max = item.stock > 0 ? item.stock : 99;
    setItems((previous) => {
      const existing = previous.find((current) => current.productId === item.productId);
      if (existing) {
        return previous.map((current) =>
          current.productId === item.productId
            ? { ...current, quantity: Math.min(max, current.quantity + quantity) }
            : current,
        );
      }
      return [...previous, { ...item, quantity: Math.min(max, Math.max(1, quantity)) }];
    });
    notify(`${item.name} se agregó al carrito`);
  }

  function remove(productId: string) {
    setItems((previous) => previous.filter((item) => item.productId !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((previous) =>
      previous
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, Math.min(item.stock > 0 ? item.stock : 99, quantity)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function clear() {
    setItems([]);
  }

  const value: CartContextValue = {
    items,
    ready,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add,
    remove,
    setQuantity,
    clear,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-jungle-950 px-5 py-3 text-[12px] font-bold text-white shadow-2xl sm:bottom-8 sm:left-auto sm:right-8 sm:translate-x-0">
          <Icon name="check" className="h-4 w-4 text-lime-400" strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}
