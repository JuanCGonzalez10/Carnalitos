import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * Punto de integración con facturación electrónica.
 *
 * La aplicación no genera ni valida facturas DIAN por sí sola. Cuando el
 * negocio contrate un proveedor autorizado (Factus, Alegra, Siigo, etc.) y
 * configure las credenciales, este endpoint debe mapear la reserva al API del
 * proveedor. Hasta entonces responde 501 y la interfaz lo muestra como
 * "no configurado" (nunca como factura emitida).
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;

  const configured = Boolean(process.env.FACTUS_CLIENT_ID && process.env.FACTUS_CLIENT_SECRET && process.env.FACTUS_API_URL);
  if (!configured) {
    return NextResponse.json(
      {
        error:
          "La facturación electrónica no está configurada. Agrega las credenciales del proveedor autorizado en .env.local. La app no simula facturas DIAN.",
        code: "INVOICING_NOT_CONFIGURED",
      },
      { status: 501 },
    );
  }

  return NextResponse.json(
    {
      error:
        "Credenciales detectadas, pero falta implementar el mapeo específico del proveedor contratado. Consulta docs/INTEGRACIONES.md.",
      code: "INVOICING_MAPPING_PENDING",
    },
    { status: 501 },
  );
}
