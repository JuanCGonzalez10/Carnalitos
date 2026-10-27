import PDFDocument from "pdfkit";
import type { Booking } from "@/types";
import { formatCOP } from "@/lib/booking/pricing";

const GREEN = "#0B5D3B";
const LIME = "#B7E400";
const INK = "#111111";
const MUTED = "#666666";

function dateLong(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export async function buildReceiptPdf(booking: Booking, businessName: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 46, info: { Title: `Comprobante ${booking.code}` } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Encabezado
  doc.rect(0, 0, 595, 118).fill(GREEN);
  doc.rect(0, 112, 595, 6).fill(LIME);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text(businessName, 46, 34);
  doc.fillColor(LIME).font("Helvetica").fontSize(9).text("COMPROBANTE DE RESERVA Y PAGOS", 46, 64, { characterSpacing: 1.5 });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text(booking.code, 46, 82, { align: "right", width: 503 });
  doc.fillColor(INK);

  let y = 145;
  doc.font("Helvetica-Bold").fontSize(14).text("Resumen de la reserva", 46, y);
  y += 24;

  const rows: Array<[string, string]> = [
    ["Huésped", booking.guestName],
    ["Correo", booking.guestEmail],
    ["Teléfono", booking.guestPhone],
    ["Alojamiento", booking.glampingName ?? ""],
    ["Llegada", dateLong(booking.checkIn)],
    ["Salida", dateLong(booking.checkOut)],
    ["Huéspedes", `${booking.guests} · ${booking.nights} noche(s)`],
    ["Estado", booking.status],
  ];

  doc.fontSize(10);
  for (const [label, value] of rows) {
    doc.fillColor(MUTED).font("Helvetica").text(label, 46, y, { width: 130 });
    doc.fillColor(INK).font("Helvetica-Bold").text(value, 180, y, { width: 370 });
    y += 18;
  }

  y += 8;
  doc.moveTo(46, y).lineTo(549, y).strokeColor("#E5E5E5").stroke();
  y += 18;

  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text("Detalle", 46, y);
  y += 20;
  const detail: Array<[string, number]> = [
    [`Alojamiento (${booking.nights} noches)`, booking.subtotal],
  ];
  for (const activity of booking.activities ?? []) {
    detail.push([`${activity.activityName} × ${activity.quantity}`, activity.total]);
  }
  for (const service of booking.services ?? []) {
    detail.push([`${service.serviceName} × ${service.quantity}`, service.total]);
  }
  for (const [label, value] of detail) {
    doc.font("Helvetica").fontSize(10).fillColor(INK).text(label, 46, y, { width: 400 });
    doc.text(formatCOP(value), 446, y, { width: 103, align: "right" });
    y += 17;
  }

  y += 6;
  const totals: Array<[string, string, boolean]> = [
    ["Total reserva", formatCOP(booking.total), true],
    ["Anticipo requerido", formatCOP(booking.depositRequired), false],
    ["Pagado", formatCOP(booking.paidAmount), false],
    ["Saldo pendiente", formatCOP(booking.balance), true],
  ];
  for (const [label, value, bold] of totals) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? GREEN : INK);
    doc.text(label, 300, y, { width: 150, align: "right" });
    doc.text(value, 446, y, { width: 103, align: "right" });
    y += bold ? 22 : 17;
  }

  y += 12;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text("Pagos registrados", 46, y);
  y += 20;
  if (!booking.payments?.length) {
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("Aún no hay pagos registrados.", 46, y);
    y += 18;
  } else {
    for (const payment of booking.payments) {
      doc.font("Helvetica").fontSize(10).fillColor(INK).text(
        `${dateLong(payment.paidAt)} · ${METHOD_LABELS[payment.method] ?? payment.method}${payment.reference ? ` · ${payment.reference}` : ""}`,
        46,
        y,
        { width: 400 },
      );
      doc.text(formatCOP(payment.amount), 446, y, { width: 103, align: "right" });
      y += 17;
    }
  }

  doc.fontSize(8).fillColor(MUTED).text(
    "Este comprobante certifica los pagos registrados en el sistema de Adrenalina Extrema Huila. No es una factura electrónica validada por la DIAN. " +
      "La facturación electrónica se emite mediante un proveedor autorizado cuando el negocio la habilite.",
    46,
    770,
    { width: 503, align: "center" },
  );
  doc.text(`Generado el ${new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short" }).format(new Date())}`, 46, 800, {
    width: 503,
    align: "center",
  });

  doc.end();
  return finished;
}
