"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de la aplicación", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-jungle-700">
        Carnalitos
      </p>
      <h1 className="mt-3 text-4xl uppercase leading-none text-ink sm:text-5xl">
        No pudimos cargar esta página
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-ink/60">
        Estamos revisando la conexión con la tienda. Intenta de nuevo en unos segundos. Si el
        problema continúa, escríbenos por WhatsApp y te ayudamos.
      </p>
      {error.digest ? (
        <p className="mt-3 text-[11px] text-ink/35">Código de referencia: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-lime">
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-outline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
