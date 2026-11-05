import { NextResponse } from "next/server";
import { requireAdminApi, handleApiError } from "@/lib/api/guard";
import { getSettings } from "@/lib/settings";
import {
  sendAutomatedWhatsAppNotification,
  sendOrderEmail,
  type OrderNotificationData,
} from "@/lib/order-notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;

  try {
    const settings = await getSettings();
    const testOrder: OrderNotificationData = {
      code: "TEST-" + Math.floor(1000 + Math.random() * 9000),
      customerName: "Prueba Sistema Carnalitos",
      customerPhone: settings.business.whatsapp || "+573108338636",
      customerEmail: settings.business.email || "carnalitosbarf@gmail.com",
      deliveryMethod: "delivery",
      address: "Calle 10 # 40-20, El Poblado",
      city: "Medellín",
      notes: "Esta es una orden de prueba para validar que WhatsApp y Correo funcionan.",
      paymentMethod: "cash",
      subtotal: 50000,
      shipping: 0,
      total: 50000,
      items: [
        {
          productName: "Snack Hígado Deshidratado 100g",
          quantity: 2,
          unitPrice: 25000,
          total: 50000,
        },
      ],
    };

    const hasWhatsAppConfig = Boolean(
      process.env.CALLMEBOT_API_KEY?.trim() ||
        process.env.TWILIO_ACCOUNT_SID ||
        process.env.WHATSAPP_GATEWAY_URL,
    );

    const hasEmailConfig = Boolean(
      process.env.EMAIL_PASS?.trim() ||
        process.env.SMTP_PASS?.trim() ||
        process.env.GMAIL_APP_PASSWORD?.trim(),
    );

    const [waResult, emailResult] = await Promise.all([
      sendAutomatedWhatsAppNotification(testOrder, settings.business.whatsapp),
      sendOrderEmail(testOrder, settings.business.email),
    ]);

    return NextResponse.json({
      config: {
        hasWhatsAppConfig,
        hasEmailConfig,
        targetPhone: settings.business.whatsapp,
        targetEmail: settings.business.email,
      },
      whatsapp: waResult,
      email: emailResult,
    });
  } catch (error) {
    return handleApiError(error, "test notifications");
  }
}

