"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useCart } from "@/components/store/CartProvider";
import type { Product } from "@/types";

export default function AddToCart({
  product,
  withQuantity = false,
  className = "",
}: {
  product: Product;
  withQuantity?: boolean;
  className?: string;
}) {
  const { add, items, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const disabled = product.stock <= 0;

  const cartItem = ready ? items.find((i) => i.productId === product.id) : undefined;
  const inCart = Boolean(cartItem && cartItem.quantity > 0);

  function handleAdd() {
    if (disabled) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit,
        stock: product.stock,
      },
      quantity,
    );
  }

  if (!withQuantity) {
    if (disabled) {
      return (
        <button
          type="button"
          disabled
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] cursor-not-allowed bg-ink/5 text-ink/30 ${className}`}
        >
          <Icon name="cart" className="h-4 w-4" />
          Agotado
        </button>
      );
    }

    if (inCart) {
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <Link
            href="/carrito"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-lime-400 px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink hover:bg-lime-300 transition"
          >
            <Icon name="cart" className="h-3.5 w-3.5" />
            Ver carrito {cartItem && cartItem.quantity > 1 ? `(${cartItem.quantity})` : ""}
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jungle-950 text-white hover:bg-jungle-700 transition"
            title="Agregar una unidad más"
            aria-label="Agregar una unidad más"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleAdd}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition bg-jungle-950 text-white hover:bg-jungle-700 ${className}`}
      >
        <Icon name="cart" className="h-4 w-4" />
        Agregar al carrito
      </button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-1.5">
        <span className="pl-3 text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Cantidad</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition hover:bg-cream-100 disabled:opacity-30"
            aria-label="Quitar una unidad"
          >
            <Icon name="minus" className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-display text-lg">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(product.stock > 0 ? product.stock : 99, value + 1))}
            disabled={quantity >= product.stock}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition hover:bg-cream-100 disabled:opacity-30"
            aria-label="Agregar una unidad"
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {inCart ? (
          <>
            <Link href="/carrito" className="btn-lime flex-1">
              <Icon name="cart" className="h-4 w-4" /> Ver carrito ({cartItem?.quantity})
            </Link>
            <button
              type="button"
              onClick={handleAdd}
              disabled={disabled}
              className="btn-outline flex-1"
            >
              <Icon name="plus" className="h-4 w-4" /> Agregar más
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className={`btn flex-1 ${disabled ? "cursor-not-allowed bg-ink/10 text-ink/35" : "bg-lime-400 text-ink hover:bg-lime-300"}`}
          >
            <Icon name="cart" className="h-4 w-4" />
            {disabled ? "Producto agotado" : "Agregar al carrito"}
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-ink/40">
        {disabled
          ? "Escríbenos por WhatsApp para avisarte cuando llegue."
          : product.stock <= 5
            ? `Últimas ${product.stock} unidades disponibles`
            : "Disponible para envío inmediato"}
      </p>
    </div>
  );
}
