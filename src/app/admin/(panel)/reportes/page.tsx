import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PrintButton from "@/components/admin/PrintButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getReport } from "@/lib/data/orders";
import { formatCOP, formatNumber } from "@/lib/store/format";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reportes · Panel",
  robots: { index: false, follow: false },
};

function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function dateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const from = isValidDate(params.from) ? params.from : dateInput(new Date(today.getFullYear(), today.getMonth(), 1));
  const to = isValidDate(params.to) ? params.to : dateInput(today);
  const report = await getReport(from, to);
  const exportUrl = `/api/admin/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const maxProduct = Math.max(...report.topProducts.map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Analítica</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Reportes de ventas</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Consulta el desempeño de la tienda entre dos fechas, revisa los pedidos y descarga la información en CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <a href={exportUrl} className="btn-jungle btn-sm">
            <Icon name="download" className="h-3.5 w-3.5" /> Descargar CSV
          </a>
          <PrintButton />
        </div>
      </div>

      <form method="get" className="admin-card flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="report-from" className="admin-label">Desde</label>
          <input id="report-from" type="date" name="from" defaultValue={from} className="admin-input" />
        </div>
        <div className="flex-1">
          <label htmlFor="report-to" className="admin-label">Hasta</label>
          <input id="report-to" type="date" name="to" defaultValue={to} className="admin-input" />
        </div>
        <button type="submit" className="btn-dark btn-sm">
          <Icon name="chart" className="h-3.5 w-3.5" /> Generar reporte
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pedidos", value: formatNumber(report.totalOrders), icon: "package" as const },
          { label: "Unidades vendidas", value: formatNumber(report.units), icon: "bag" as const },
          { label: "Ingresos cobrados", value: formatCOP(report.revenue), icon: "money" as const },
          { label: "Saldo por cobrar", value: formatCOP(report.pending), icon: "card" as const },
        ].map((item) => (
          <div key={item.label} className="admin-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-100 text-jungle-700">
              <Icon name={item.icon} className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink/35">{item.label}</p>
            <p className="mt-1 font-display text-2xl leading-none">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ink/40">
        Periodo analizado: <strong>{formatDate(from)}</strong> a <strong>{formatDate(to)}</strong>. Ticket promedio:{" "}
        <strong>{formatCOP(report.averageTicket)}</strong>.
      </p>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <section className="admin-card overflow-hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Detalle</p>
              <h2 className="mt-1 text-xl uppercase">Pedidos del periodo</h2>
            </div>
            <span className="badge bg-jungle-50 text-jungle-700">{report.totalOrders}</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/pedidos/${order.id}`} className="font-mono text-[11px] font-bold text-jungle-700 hover:underline">
                        {order.code}
                      </Link>
                    </td>
                    <td>
                      <p className="text-[12px] font-semibold">{order.customerName}</p>
                      <p className="text-[10px] text-ink/40">{order.itemsCount ?? 0} artículo{order.itemsCount === 1 ? "" : "s"}</p>
                    </td>
                    <td className="text-[11px] text-ink/50">{formatDate(order.createdAt)}</td>
                    <td className="text-[12px] font-semibold">{formatCOP(order.total)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td><StatusBadge status={order.paymentStatus} type="payment" /></td>
                  </tr>
                ))}
                {report.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-ink/35">
                      No hay pedidos registrados en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Ranking</p>
              <h2 className="mt-1 text-xl uppercase">Más vendidos</h2>
            </div>
            <div className="mt-4 space-y-3">
              {report.topProducts.map((product) => (
                <div key={product.name}>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="truncate font-bold">{product.name}</span>
                    <span className="shrink-0 font-semibold text-jungle-800">{formatCOP(product.total)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                      <div className="h-full rounded-full bg-jungle-600" style={{ width: `${Math.max(4, (product.total / maxProduct) * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-semibold text-ink/40">{product.quantity} u.</span>
                  </div>
                </div>
              ))}
              {report.topProducts.length === 0 && (
                <p className="py-6 text-center text-sm text-ink/35">Sin ventas en el periodo.</p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Categorías</p>
              <h2 className="mt-1 text-xl uppercase">Ventas por categoría</h2>
            </div>
            <div className="mt-4 divide-y divide-ink/[0.06]">
              {report.categorySales.map((category) => (
                <div key={category.name} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <span className="text-[12px] font-semibold">{category.name}</span>
                  <span className="text-[11px] font-bold text-jungle-800">{formatCOP(category.total)}</span>
                </div>
              ))}
              {report.categorySales.length === 0 && (
                <p className="py-6 text-center text-sm text-ink/35">Sin ventas en el periodo.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
