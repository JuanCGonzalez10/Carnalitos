"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F3E8",
          color: "#1F2A22",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "520px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Carnalitos
          </p>
          <h1 style={{ fontSize: "34px", lineHeight: 1, margin: "12px 0 0" }}>
            No pudimos cargar la tienda
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, opacity: 0.65 }}>
            Ocurrió un error temporal. Recarga la página en unos segundos. Si continúa, escríbenos
            por WhatsApp.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "11px", opacity: 0.4 }}>Código de referencia: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              border: 0,
              borderRadius: "999px",
              background: "#C6F24E",
              color: "#1F2A22",
              padding: "14px 24px",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
