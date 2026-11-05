import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { createOrder, OrderError } from "@/lib/data/orders";
import { orderCreateSchema } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import {
  buildOrderWhatsAppUrl,
  sendOrderEmail,
  sendAutomatedWhatsAppNotification,
  sendTelegramNotification,
} from "@/lib/order-notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (!rateLimit(`orders:${ip}`, 12, 10 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Recibimos varios pedidos seguidos. Espera unos minutos o escríbenos por WhatsApp." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Revisa los datos del pedido." },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(parsed.data);
    const settings = await getSettings();

    const notificationData = {
      code: order.code,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      deliveryMethod: order.deliveryMethod as "delivery" | "pickup",
      address: order.address,
      city: order.city || "Medellín",
      notes: order.notes,
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      items: (order.items || []).map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        total: Number(it.total),
      })),
    };

    // Generar enlace de respaldo por si se requiere
    const whatsappUrl = buildOrderWhatsAppUrl(
      settings.business.whatsapp,
      notificationData,
    );

    // Enviar notificaciones automáticas desde el servidor (WhatsApp, Correo, Telegram al dueño de la tienda)
    // Damos hasta 2.5 segundos para despachar las peticiones de red antes de responder al cliente
    try {
      await Promise.race([
        Promise.allSettled([
          sendAutomatedWhatsAppNotification(notificationData, settings.business.whatsapp),
          sendOrderEmail(notificationData, settings.business.email),
          sendTelegramNotification(notificationData),
        ]),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch (notifErr) {
      console.error("[NOTIFICACIONES] Error durante el despacho:", notifErr);
    }

    return NextResponse.json(
      {
        order: {
          code: order.code,
          total: order.total,
          whatsappUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("create order", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp." },
      { status: 500 },
    );
  }
}
