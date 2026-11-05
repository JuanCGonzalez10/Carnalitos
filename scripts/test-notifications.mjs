import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({ path: ".env.local" });
dotenv.config();

const phone = process.env.CALLMEBOT_PHONE || process.env.NEXT_PUBLIC_WHATSAPP || "+573108338636";
const callmebotKey = process.env.CALLMEBOT_API_KEY?.trim();
const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "carnalitosbarf@gmail.com";
const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

console.log("=================================================");
console.log("🐾 PROBADOR DE NOTIFICACIONES AUTOMÁTICAS 🐾");
console.log("=================================================");
console.log(`📱 Teléfono de destino (WhatsApp): ${phone}`);
console.log(`🔑 CallMeBot API Key: ${callmebotKey ? "CONFIGURADO (" + callmebotKey.slice(0, 3) + "***)" : "❌ NO CONFIGURADO"}`);
console.log(`📧 Correo de destino: ${emailUser}`);
console.log(`🔑 Contraseña de aplicación Gmail: ${emailPass ? "CONFIGURADA (16 caracteres)" : "❌ NO CONFIGURADA"}`);
console.log("=================================================\n");

async function testWhatsApp() {
  if (!callmebotKey) {
    console.log("❌ [WHATSAPP]: Falta CALLMEBOT_API_KEY en .env.local");
    console.log("👉 Para obtenerla gratis en 15 segundos:");
    console.log("   1. Abre WhatsApp en tu celular (" + phone + ")");
    console.log("   2. Escribe al número activo de CallMeBot: +34 623 78 64 49");
    console.log("      (o abre este enlace: https://wa.me/34623786449?text=I+allow+callmebot+to+send+me+messages )");
    console.log("      (si está saturado, usa la alternativa: https://wa.me/34644954275?text=I+allow+callmebot+to+send+me+messages )");
    console.log("   3. Envía el mensaje: I allow callmebot to send me messages");
    console.log("   4. CallMeBot te responderá con tu API Key (ejemplo: 1234567)");
    console.log("   5. Pega esa clave en tu archivo .env.local:");
    console.log("      CALLMEBOT_API_KEY=1234567\n");
    return;
  }

  try {
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const target = cleanPhone.startsWith("57") ? `+${cleanPhone}` : `+57${cleanPhone}`;
    const testMsg = "🐾 [PRUEBA CARNALITOS] ¡El sistema de notificaciones automáticas por WhatsApp está funcionando correctamente!";
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(target)}&text=${encodeURIComponent(testMsg)}&apikey=${encodeURIComponent(callmebotKey)}`;
    
    console.log(`⏳ Enviando WhatsApp de prueba a ${target}...`);
    const res = await fetch(url);
    const body = await res.text();
    if (res.ok && !body.toLowerCase().includes("error")) {
      console.log("✅ ¡ÉXITO! WhatsApp de prueba enviado. Revisa tu celular.");
    } else {
      console.log(`⚠️ CallMeBot respondió con error: ${body}`);
    }
  } catch (err) {
    console.log(`❌ Error al conectar con CallMeBot:`, err.message);
  }
}

async function testEmail() {
  if (!emailPass) {
    console.log("\n❌ [CORREO]: Falta EMAIL_PASS o SMTP_PASS en .env.local");
    console.log("👉 Para obtenerla en 30 segundos (Google App Password):");
    console.log("   1. Inicia sesión en Google con: " + emailUser);
    console.log("   2. Entra a: https://myaccount.google.com/apppasswords");
    console.log("   3. Escribe de nombre 'Carnalitos Web' y dale clic a 'Crear'");
    console.log("   4. Google te mostrará un código de 16 letras (ejemplo: abcd efgh ijkl mnop)");
    console.log("   5. Pega ese código en tu archivo .env.local:");
    console.log("      EMAIL_PASS=abcdefghijklmnop\n");
    return;
  }

  try {
    console.log(`\n⏳ Enviando correo de prueba a ${emailUser}...`);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Carnalitos Tienda" <${emailUser}>`,
      to: emailUser,
      subject: "🐾 [PRUEBA] Notificaciones automáticas de Carnalitos",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #fbf7ee; border-radius: 12px;">
          <h2 style="color: #052a1b;">🐾 ¡El correo de Carnalitos está configurado!</h2>
          <p>Este es un correo de prueba enviado desde tu tienda en línea.</p>
          <p>Cada vez que un cliente complete un pedido, recibirás los detalles completos aquí automáticamente.</p>
        </div>
      `,
    });
    console.log("✅ ¡ÉXITO! Correo de prueba enviado. Revisa tu bandeja de entrada en " + emailUser);
  } catch (err) {
    console.log(`❌ Error al enviar correo de prueba:`, err.message);
    if (err.message.includes("BadCredentials") || err.message.includes("Username and Password not accepted")) {
      console.log("👉 Google rechazó la contraseña. Recuerda que DEBES usar una 'Contraseña de Aplicación' de 16 letras generada en https://myaccount.google.com/apppasswords, NO tu contraseña normal de inicio de sesión.");
    }
  }
}

async function run() {
  await testWhatsApp();
  await testEmail();
  console.log("\n=================================================");
}

run();

