import { NextResponse } from "next/server";
import { requireAdminApi, handleApiError } from "@/lib/api/guard";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("error" in auth) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const where: string[] = [];
    const params: unknown[] = [];
    let index = 1;
    if (from) {
      where.push(`b.check_in >= $${index}::date`);
      params.push(from);
      index += 1;
    }
    if (to) {
      where.push(`b.check_in <= $${index}::date`);
      params.push(to);
      index += 1;
    }
    if (status) {
      where.push(`b.status = $${index}`);
      params.push(status);
      index += 1;
    }

    const rows = await query<Record<string, unknown>>(
      `select b.code, b.created_at, b.guest_name, b.guest_email, b.guest_phone,
              g.name as glamping, b.check_in, b.check_out, b.nights, b.guests,
              b.status, b.payment_status, b.total, b.deposit_required, b.paid_amount, b.balance,
              b.activities_total, b.services_total, b.source
       from bookings b join glampings g on g.id = b.glamping_id
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by b.check_in desc
       limit 10000`,
      params,
    );

    const header = [
      "Código", "Creada", "Huésped", "Correo", "Teléfono", "Alojamiento", "Llegada", "Salida",
      "Noches", "Huéspedes", "Estado", "Estado pago", "Total", "Anticipo", "Pagado", "Saldo",
      "Actividades", "Servicios", "Origen",
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.code, row.created_at, row.guest_name, row.guest_email, row.guest_phone, row.glamping,
          row.check_in, row.check_out, row.nights, row.guests, row.status, row.payment_status,
          row.total, row.deposit_required, row.paid_amount, row.balance, row.activities_total,
          row.services_total, row.source,
        ]
          .map(csvCell)
          .join(","),
      );
    }

    const csv = `\uFEFF${lines.join("\r\n")}`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-reservas-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "report export");
  }
}
