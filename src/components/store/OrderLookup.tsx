"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

export default function OrderLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      setError("Escribe el código que recibiste al confirmar tu pedido.");
      return;
    }
    router.push(`/pedido/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-ink/[0.08] bg-white p-6 sm:p-8">
      <label htmlFor="order-code" className="field-label">Código de pedido</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="package" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            id="order-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="field pl-10 font-mono uppercase"
            placeholder="CAR-XXXXXXXX"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn-jungle">
          Buscar pedido <Icon name="arrow" className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-[11px] leading-5 text-ink/40">
        El código viene en la confirmación de tu compra y tiene el formato <strong>CAR-XXXXXXXX</strong>.
        Si no lo encuentras, escríbenos por WhatsApp.
      </p>
    </form>
  );
}
