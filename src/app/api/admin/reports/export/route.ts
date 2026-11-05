import { requireAdminApi } from "@/lib/api/guard";
import { getOrdersForRange } from "@/lib/data/orders";
import { DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/format";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function validDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = validDate(url.searchParams.get("from"), `${today.slice(0, 7)}-01`);
  const to = validDate(url.searchParams.get("to"), today);

  const orders = await getOrdersForRange(from, to);
  const headers = [
    "Código",
    "Fecha",
    "Cliente",
    "Correo",
    "Teléfono",
    "Entrega",
    "Ciudad",
    "Dirección",
    "Artículos",
    "Subtotal",
    "Envío",
    "Total",
    "Estado",
    "Pago",
    "Estado del pago",
  ];

  const rows = orders.map((order) => [
    order.code,
    new Date(order.createdAt).toISOString().slice(0, 19).replace("T", " "),
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod,
    order.city,
    order.address,
    order.itemsCount ?? 0,
    order.subtotal,
    order.shipping,
    order.total,
    ORDER_STATUS_LABELS[order.status] ?? order.status,
    PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus,
  ]);

  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="carnalitos-pedidos-${from}-a-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
