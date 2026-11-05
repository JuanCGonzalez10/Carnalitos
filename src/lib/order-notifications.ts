import nodemailer from "nodemailer";
import { formatCOP } from "@/lib/store/format";
import { PAYMENT_METHOD_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/utils/format";

export interface OrderNotificationItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderNotificationData {
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  city: string;
  notes?: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: OrderNotificationItem[];
}

/**
 * Mensaje estructurado de la orden con todos los datos clave solicitados.
 */
export function buildOrderTextMessage(order: OrderNotificationData): string {
  const deliveryLabel =
    order.deliveryMethod === "pickup"
      ? "Recoger en tienda (Medellín)"
      : `Envío a domicilio en Medellín (${order.shipping === 0 ? "Gratis" : formatCOP(order.shipping)})`;

  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;

  const itemsList = order.items
    .map((it, idx) => `  ${idx + 1}. *${it.productName}* x${it.quantity} — ${formatCOP(it.total)}`)
    .join("\n");

  const lines = [
    `🐾 *¡NUEVO PEDIDO REGISTRADO EN CARNALITOS!* 🐾`,
    `*Código:* ${order.code}`,
    `----------------------------------------`,
    `👤 *Cliente:* ${order.customerName}`,
    `📱 *Teléfono:* ${order.customerPhone}`,
    `📧 *Correo:* ${order.customerEmail}`,
    `📍 *Dirección:* ${order.deliveryMethod === "pickup" ? "Recogida en tienda (Medellín)" : `${order.address}, Medellín`}`,
    `🚚 *Entrega:* ${deliveryLabel}`,
    `💳 *Método de pago:* ${paymentLabel}`,
    order.notes ? `📝 *Notas:* ${order.notes}` : null,
    `----------------------------------------`,
    `🛒 *PRODUCTOS ORDENADOS:*`,
    itemsList,
    `----------------------------------------`,
    `💵 *Subtotal:* ${formatCOP(order.subtotal)}`,
    order.shipping > 0
      ? `🛵 *Domicilio Medellín:* ${formatCOP(order.shipping)}`
      : `🛵 *Domicilio Medellín:* Gratis`,
    `💰 *TOTAL A PAGAR:* ${formatCOP(order.total)}`,
    `----------------------------------------`,
    `Pedido generado automáticamente desde la tienda en línea.`,
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Genera el enlace tradicional de WhatsApp por si el cliente o la tienda quieren abrir el chat.
 */
export function buildOrderWhatsAppUrl(
  storePhone: string,
  order: OrderNotificationData,
): string {
  const message = buildOrderTextMessage(order);
  const cleanPhone = storePhone.replace(/[^\d]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * ENVÍO AUTOMÁTICO DE WHATSAPP DESDE EL SERVIDOR (sin depender del cliente)
 * Se envía directamente al número de la tienda / dueño (+57 310 833 8636).
 * Soporta:
 *  1. CallMeBot (Servicio gratuito y rápido para recibir alertas a tu WhatsApp personal)
 *  2. Twilio WhatsApp API
 *  3. Meta WhatsApp Cloud API
 *  4. Gateway propio o Webhook (Evolution API, UltraMsg, WPPConnect, etc.)
 */
export async function sendAutomatedWhatsAppNotification(
  order: OrderNotificationData,
  ownerPhone: string = "+573108338636",
): Promise<{ success: boolean; provider?: string; error?: string }> {
  const cleanPhone = ownerPhone.replace(/[^\d]/g, "");
  const textMessage = buildOrderTextMessage(order);

  // 1. Proveedor CallMeBot (100% gratuito, envía directo a tu WhatsApp)
  // Configurable en .env.local: CALLMEBOT_API_KEY
  const callmebotKey = process.env.CALLMEBOT_API_KEY;
  if (callmebotKey && callmebotKey.trim()) {
    try {
      const targetPhone = (process.env.CALLMEBOT_PHONE || cleanPhone).trim();
      const formattedPhone = targetPhone.startsWith("+") ? targetPhone : `+${targetPhone}`;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(textMessage)}&apikey=${encodeURIComponent(callmebotKey.trim())}`;
      
      const res = await fetch(url, { method: "GET" });
      const responseBody = await res.text();
      
      if (res.ok && !responseBody.toLowerCase().includes("error")) {
        console.log(`[WHATSAPP AUTO] ✓ Mensaje enviado vía CallMeBot a ${formattedPhone}`);
        return { success: true, provider: "callmebot" };
      } else {
        console.error(`[WHATSAPP AUTO] CallMeBot respondió: ${res.status} - ${responseBody}`);
        return { success: false, provider: "callmebot", error: responseBody };
      }
    } catch (e) {
      console.error("[WHATSAPP AUTO] Error de red al enviar por CallMeBot:", e);
      return { success: false, provider: "callmebot", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 2. Proveedor Twilio WhatsApp API
  // Configurable en .env.local: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // ej: whatsapp:+14155238886
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const to = `whatsapp:+${cleanPhone}`;
      const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
      const form = new URLSearchParams();
      form.append("From", twilioFrom);
      form.append("To", to);
      form.append("Body", textMessage);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      if (res.ok) {
        console.log(`[WHATSAPP AUTO] ✓ Mensaje enviado vía Twilio a ${to}`);
        return { success: true, provider: "twilio" };
      } else {
        const errBody = await res.text();
        console.error(`[WHATSAPP AUTO] Twilio respondió: ${res.status} - ${errBody}`);
        return { success: false, provider: "twilio", error: errBody };
      }
    } catch (e) {
      console.error("[WHATSAPP AUTO] Error al enviar por Twilio:", e);
      return { success: false, provider: "twilio", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 3. Proveedor Green API (Gratis, vinculas tu WhatsApp escaneando código QR)
  // Configurable en .env.local: GREEN_API_ID_INSTANCE, GREEN_API_TOKEN_INSTANCE
  const greenId = process.env.GREEN_API_ID_INSTANCE?.trim();
  const greenToken = process.env.GREEN_API_TOKEN_INSTANCE?.trim();
  if (greenId && greenToken) {
    try {
      const chatId = cleanPhone.startsWith("57") ? `${cleanPhone}@c.us` : `57${cleanPhone}@c.us`;
      const url = `https://api.green-api.com/waInstance${greenId}/sendMessage/${greenToken}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: textMessage,
        }),
      });
      if (res.ok) {
        console.log(`[WHATSAPP AUTO] ✓ Mensaje enviado vía Green API a ${chatId}`);
        return { success: true, provider: "green-api" };
      } else {
        const errBody = await res.text();
        console.error(`[WHATSAPP AUTO] Green API respondió: ${res.status} - ${errBody}`);
        return { success: false, provider: "green-api", error: errBody };
      }
    } catch (e) {
      console.error("[WHATSAPP AUTO] Error en Green API:", e);
      return { success: false, provider: "green-api", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 4. Gateway genérico / Webhook (Evolution API / UltraMsg / Baileys)
  // Configurable en .env.local: WHATSAPP_GATEWAY_URL
  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
  if (gatewayUrl) {
    try {
      const gatewayToken = process.env.WHATSAPP_GATEWAY_TOKEN || "";
      const res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          phone: cleanPhone,
          to: cleanPhone,
          message: textMessage,
          text: textMessage,
          orderCode: order.code,
        }),
      });
      if (res.ok) {
        console.log(`[WHATSAPP AUTO] ✓ Mensaje enviado vía Gateway a ${cleanPhone}`);
        return { success: true, provider: "gateway" };
      } else {
        const errBody = await res.text();
        console.error(`[WHATSAPP AUTO] Gateway respondió: ${res.status} - ${errBody}`);
        return { success: false, provider: "gateway", error: errBody };
      }
    } catch (e) {
      console.error("[WHATSAPP AUTO] Error en Gateway WhatsApp:", e);
      return { success: false, provider: "gateway", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Si aún no se ha colocado la API key del bot de WhatsApp, se registra el evento en el servidor:
  console.warn(`--------------------------------------------------`);
  console.warn(`[WHATSAPP AUTO - NO CONFIGURADO EN .env.local]`);
  console.warn(`Para recibir el mensaje en +${cleanPhone}, coloca tu CALLMEBOT_API_KEY en .env.local`);
  console.warn(`Contenido del mensaje que se enviaría:`);
  console.warn(textMessage);
  console.warn(`--------------------------------------------------`);

  return { success: false, provider: "none", error: "CALLMEBOT_API_KEY no configurado en .env.local" };
}

/**
 * Notificación instantánea vía Bot de Telegram (Opcional, 100% gratuito y nunca caduca)
 */
export async function sendTelegramNotification(
  order: OrderNotificationData,
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return { success: false, error: "Telegram no configurado" };

  try {
    const textMessage = buildOrderTextMessage(order);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
      }),
    });
    if (res.ok) {
      console.log(`[TELEGRAM AUTO] ✓ Mensaje enviado al chat ${chatId}`);
      return { success: true };
    }
    const err = await res.text();
    return { success: false, error: err };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * ENVÍO AUTOMÁTICO DE CORREO DESDE EL SERVIDOR (sin depender del cliente)
 * Envía el detalle completo de la orden a carnalitosbarf@gmail.com
 */
export async function sendOrderEmail(
  order: OrderNotificationData,
  storeEmail: string = "carnalitosbarf@gmail.com",
): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.ADMIN_EMAIL ||
    "carnalitosbarf@gmail.com";
  const pass = (
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  ).replace(/\s+/g, "");

  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
  const deliveryLabel =
    DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0eae1; font-weight: 600; color: #1e293b;">
          ${item.productName}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0eae1; text-align: center; color: #475569;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0eae1; text-align: right; color: #475569;">
          ${formatCOP(item.unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0eae1; text-align: right; font-weight: 700; color: #0f172a;">
          ${formatCOP(item.total)}
        </td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbf7ee; margin: 0; padding: 24px; color: #2e241f;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eae2d3; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background-color: #052a1b; padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffcc29; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em;">
            🐾 ¡Nueva Orden Registrada!
          </h1>
          <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0; opacity: 0.85;">
            Código del pedido: <strong style="color: #ffcc29;">${order.code}</strong>
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #052a1b; margin-top: 0; border-bottom: 2px solid #ffcc29; padding-bottom: 6px;">
            Datos del Cliente y Entrega
          </h2>
          <table style="width: 100%; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <tr>
              <td style="color: #64748b; width: 140px; padding: 4px 0;"><strong>Nombre:</strong></td>
              <td style="color: #0f172a; font-weight: 600;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Teléfono:</strong></td>
              <td style="color: #0f172a;"><a href="tel:${order.customerPhone}" style="color: #0e5236; font-weight: 600;">${order.customerPhone}</a></td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Correo:</strong></td>
              <td style="color: #0f172a;">${order.customerEmail}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Dirección:</strong></td>
              <td style="color: #0f172a; font-weight: 600;">
                ${order.deliveryMethod === "pickup" ? "Recogida en tienda (Medellín)" : `${order.address}, Medellín`}
              </td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Entrega:</strong></td>
              <td style="color: #0f172a;">${deliveryLabel}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Método de pago:</strong></td>
              <td style="color: #0f172a; font-weight: 600; color: #0e5236;">${paymentLabel}</td>
            </tr>
            ${
              order.notes
                ? `
            <tr>
              <td style="color: #64748b; padding: 4px 0;"><strong>Notas:</strong></td>
              <td style="color: #0f172a; font-style: italic;">${order.notes}</td>
            </tr>`
                : ""
            }
          </table>

          <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #052a1b; margin-top: 24px; border-bottom: 2px solid #ffcc29; padding-bottom: 6px;">
            Productos Ordenados
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em;">
                <th style="padding: 10px 12px; text-align: left;">Producto</th>
                <th style="padding: 10px 12px; text-align: center;">Cant.</th>
                <th style="padding: 10px 12px; text-align: right;">Unitario</th>
                <th style="padding: 10px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totales -->
          <div style="margin-top: 20px; padding: 16px; background-color: #fbf7ee; border-radius: 12px; border: 1px solid #ebdcc5;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #0f172a;">${formatCOP(order.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px;">
              <span>Domicilio Medellín:</span>
              <span style="font-weight: 600; color: #0f172a;">${order.shipping === 0 ? "Gratis" : formatCOP(order.shipping)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #052a1b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <span>TOTAL A PAGAR:</span>
              <span style="color: #0e5236;">${formatCOP(order.total)}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b;">
          Carnalitos · Snacks y comida saludable para mascotas · Medellín, Colombia
        </div>
      </div>
    </body>
    </html>
  `;

  // Si no hay contraseña SMTP en .env.local, se registra la orden para no fallar
  if (!pass) {
    console.warn(`--------------------------------------------------`);
    console.warn(`[EMAIL AUTO - NO CONFIGURADO EN .env.local]`);
    console.warn(`Para recibir el correo de la orden en ${storeEmail}, coloca tu EMAIL_PASS (Contraseña de aplicación de Google) en .env.local`);
    console.warn(`--------------------------------------------------`);
    return { success: false, error: "EMAIL_PASS no configurado en .env.local" };
  }

  try {
    const isGmail = host.toLowerCase().includes("gmail");
    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: { user, pass },
          }
        : {
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
          },
    );

    await transporter.sendMail({
      from: `"Carnalitos Tienda" <${user}>`,
      to: storeEmail,
      replyTo: order.customerEmail,
      subject: `🐾 ¡Nueva orden #${order.code}! — ${order.customerName} (${formatCOP(order.total)})`,
      html,
    });

    console.log(`[EMAIL AUTO] ✓ Correo enviado exitosamente a ${storeEmail}`);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL AUTO] Error al enviar correo de orden:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar correo",
    };
  }
}
