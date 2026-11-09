import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getAccountingReport } from "@/lib/data/orders";
import { listProducts } from "@/lib/data/products";
import { formatCOP, formatNumber } from "@/lib/store/format";
import {
  PAYMENT_METHOD_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contabilidad · Panel",
  robots: { index: false, follow: false },
};

type Period = "day" | "month" | "year" | "custom";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isValidMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function isValidYear(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}$/.test(value));
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function dayLabel(key: string): string {
  return formatDate(key, { weekday: "short", day: "2-digit", month: "short" });
}

function resolvePeriod(
  params: { period?: string; date?: string; month?: string; year?: string; from?: string; to?: string },
  today: Date,
): { period: Period; from: string; to: string } {
  const requested = params.period;
  const period: Period =
    requested === "day" || requested === "month" || requested === "year" || requested === "custom"
      ? requested
      : "month";

  if (period === "day") {
    const date = isValidDate(params.date) ? params.date : ymd(today);
    return { period, from: date, to: date };
  }

  if (period === "month") {
    const month = isValidMonth(params.month) ? params.month : ymd(today).slice(0, 7);
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return { period, from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
  }

  if (period === "year") {
    const year = isValidYear(params.year) ? params.year : ymd(today).slice(0, 4);
    return { period, from: `${year}-01-01`, to: `${year}-12-31` };
  }

  const fallbackFrom = `${ymd(today).slice(0, 7)}-01`;
  const from = isValidDate(params.from) ? params.from : fallbackFrom;
  const to = isValidDate(params.to) ? params.to : ymd(today);
  return from <= to ? { period, from, to } : { period, from: to, to: from };
}

function Kpi({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "negative" | "muted";
}) {
  const valueClass =
    tone === "negative"
      ? "text-red-600"
      : tone === "positive"
        ? "text-jungle-800"
        : tone === "muted"
          ? "text-ink/50"
          : "text-ink";
  return (
    <div className="admin-card !p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink/35">{label}</p>
      <p className={`mt-1.5 font-display text-2xl leading-none ${valueClass}`}>{value}</p>
      {helper && <p className="mt-1 text-[10px] text-ink/40">{helper}</p>}
    </div>
  );
}

export default async function AdminAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    date?: string;
    month?: string;
    year?: string;
    from?: string;
    to?: string;
    expenses?: string;
  }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const { period, from, to } = resolvePeriod(params, today);
  const expenses = Math.max(0, Number(params.expenses) || 0);

  const [report, products] = await Promise.all([
    getAccountingReport(from, to, expenses),
    listProducts({ includeCost: true, limit: 100 }),
  ]);

  const productsWithoutCost = products.filter((product) => (product.cost ?? 0) <= 0).length;
  const visibleSales = report.sales.slice(0, 200);
  const monthKey = from.slice(0, 7);
  const yearKey = from.slice(0, 4);

  const tabs: Array<{ key: Period; label: string; href: string }> = [
    { key: "day", label: "Día", href: `/admin/contabilidad?period=day&date=${ymd(today)}` },
    { key: "month", label: "Mes", href: `/admin/contabilidad?period=month&month=${monthKey}` },
    { key: "year", label: "Año", href: `/admin/contabilidad?period=year&year=${yearKey}` },
    { key: "custom", label: "Personalizado", href: `/admin/contabilidad?period=custom&from=${from}&to=${to}` },
  ];

  const tone = (value: number): "positive" | "negative" => (value < 0 ? "negative" : "positive");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Finanzas</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Contabilidad</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Ventas, costo de ventas, margen bruto, gastos operativos, ganancia neta y rentabilidad por producto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reportes" className="btn-outline btn-sm">
            <Icon name="chart" className="h-3.5 w-3.5" /> Reportes
          </Link>
          <Link href="/admin/productos" className="btn-outline btn-sm">
            <Icon name="tag" className="h-3.5 w-3.5" /> Productos
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-cream-100 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
              period === tab.key ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form method="get" className="admin-card flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="period" value={period} />

        {period === "day" && (
          <div className="flex-1">
            <label htmlFor="accounting-date" className="admin-label">Día</label>
            <input id="accounting-date" type="date" name="date" defaultValue={from} className="admin-input" />
          </div>
        )}

        {period === "month" && (
          <div className="flex-1">
            <label htmlFor="accounting-month" className="admin-label">Mes</label>
            <input id="accounting-month" type="month" name="month" defaultValue={from.slice(0, 7)} className="admin-input" />
          </div>
        )}

        {period === "year" && (
          <div className="flex-1">
            <label htmlFor="accounting-year" className="admin-label">Año</label>
            <input
              id="accounting-year"
              type="number"
              name="year"
              min={2000}
              max={2100}
              step={1}
              defaultValue={from.slice(0, 4)}
              className="admin-input"
            />
          </div>
        )}

        {period === "custom" && (
          <>
            <div className="flex-1">
              <label htmlFor="accounting-from" className="admin-label">Desde</label>
              <input id="accounting-from" type="date" name="from" defaultValue={from} className="admin-input" />
            </div>
            <div className="flex-1">
              <label htmlFor="accounting-to" className="admin-label">Hasta</label>
              <input id="accounting-to" type="date" name="to" defaultValue={to} className="admin-input" />
            </div>
          </>
        )}

        <div className="sm:w-56">
          <label htmlFor="accounting-expenses" className="admin-label">Gastos operativos (COP)</label>
          <input
            id="accounting-expenses"
            type="number"
            name="expenses"
            min={0}
            step={1000}
            defaultValue={expenses || ""}
            placeholder="Arriendo, sueldos, servicios…"
            className="admin-input"
          />
        </div>

        <button type="submit" className="btn-dark btn-sm">
          <Icon name="filter" className="h-3.5 w-3.5" /> Aplicar
        </button>
      </form>

      <p className="text-[11px] text-ink/45">
        Periodo: <strong>{formatDate(from)}</strong> a <strong>{formatDate(to)}</strong>. Los costos usan el costo
        registrado al momento de cada venta.
      </p>

      {productsWithoutCost > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-sun-400/50 bg-sun-100/50 px-4 py-3 text-[12px] text-yellow-800 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong>{productsWithoutCost}</strong> producto{productsWithoutCost === 1 ? "" : "s"} sin costo registrado.
            Su margen se calcula como 100% hasta que agregues el costo.
          </p>
          <Link href="/admin/productos" className="btn-outline btn-sm shrink-0">
            Actualizar costos
          </Link>
        </div>
      )}

      {report.totals.salesWithoutCost > 0 && (
        <div className="rounded-xl bg-jungle-50 px-4 py-3 text-[12px] text-jungle-800">
          {report.totals.salesWithoutCost} venta{report.totals.salesWithoutCost === 1 ? "" : "s"} del periodo no
          tiene{report.totals.salesWithoutCost === 1 ? "" : "n"} costo registrado, por lo que su margen aparece en 100%.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Ingresos por ventas"
          value={formatCOP(report.totals.revenue)}
          helper={`${formatNumber(report.totals.orders)} venta${report.totals.orders === 1 ? "" : "s"} · ${formatNumber(report.totals.units)} unidades`}
        />
        <Kpi
          label="Costo de ventas"
          value={formatCOP(report.totals.cost)}
          helper="Costo de los productos vendidos"
          tone="muted"
        />
        <Kpi
          label="Ganancia bruta"
          value={formatCOP(report.totals.grossProfit)}
          helper={`Margen bruto ${report.totals.grossMargin.toFixed(1)}%`}
          tone={tone(report.totals.grossProfit)}
        />
        <Kpi
          label="Ganancia neta"
          value={formatCOP(report.totals.netProfit)}
          helper={`Margen neto ${report.totals.netMargin.toFixed(1)}%`}
          tone={tone(report.totals.netProfit)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Gastos operativos"
          value={formatCOP(report.totals.expenses)}
          helper="Valor ingresado en el filtro"
          tone="muted"
        />
        <Kpi
          label="Ticket promedio"
          value={formatCOP(report.totals.averageTicket)}
          helper="Ingresos / ventas del periodo"
        />
        <Kpi
          label="Utilidad por unidad"
          value={formatCOP(report.totals.units > 0 ? report.totals.grossProfit / report.totals.units : 0)}
          helper="Ganancia bruta / unidades vendidas"
        />
        <Kpi
          label="Ventas canceladas"
          value={formatNumber(report.totals.cancelled)}
          helper="Excluidas de los cálculos"
          tone="muted"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <section className="admin-card overflow-hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Detalle contable</p>
              <h2 className="mt-1 text-xl uppercase">Ventas del periodo</h2>
            </div>
            <span className="badge bg-jungle-50 text-jungle-700">{report.sales.length}</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Uds.</th>
                  <th>Ingresos</th>
                  <th>Costo</th>
                  <th>Ganancia</th>
                  <th>Margen</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {visibleSales.map((sale) => (
                  <tr key={sale.id} className={sale.status === "cancelled" ? "opacity-50" : ""}>
                    <td>
                      <Link
                        href={`/admin/pedidos/${sale.id}`}
                        className="font-mono text-[11px] font-bold text-jungle-700 hover:underline"
                      >
                        {sale.code}
                      </Link>
                      {sale.status === "cancelled" && (
                        <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-red-700">
                          Cancelada
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[10px] text-ink/50">{formatDateTime(sale.createdAt)}</td>
                    <td className="max-w-[140px] truncate text-[11px] font-semibold">{sale.customerName}</td>
                    <td>
                      <span
                        className={`badge ${
                          sale.channel === "pos" ? "bg-lime-100 text-jungle-800" : "bg-cream-200 text-ink/55"
                        }`}
                      >
                        {sale.channel === "pos" ? "POS" : "Web"}
                      </span>
                    </td>
                    <td className="text-[11px] text-ink/55">{formatNumber(sale.units)}</td>
                    <td className="whitespace-nowrap text-[11px] font-semibold">{formatCOP(sale.revenue)}</td>
                    <td className="whitespace-nowrap text-[11px] text-ink/55">{formatCOP(sale.cost)}</td>
                    <td
                      className={`whitespace-nowrap text-[11px] font-extrabold ${
                        sale.profit < 0 ? "text-red-600" : "text-jungle-800"
                      }`}
                    >
                      {formatCOP(sale.profit)}
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-ink/55">{sale.margin.toFixed(1)}%</td>
                    <td>
                      <StatusBadge status={sale.paymentStatus} type="payment" />
                    </td>
                  </tr>
                ))}
                {visibleSales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-sm text-ink/35">
                      No hay ventas registradas en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {report.sales.length > visibleSales.length && (
            <p className="mt-3 text-[10px] text-ink/40">
              Mostrando las {visibleSales.length} ventas más recientes de {report.sales.length}. Ajusta el periodo para
              ver el detalle completo.
            </p>
          )}
        </section>

        <div className="space-y-5">
          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Productos</p>
              <h2 className="mt-1 text-xl uppercase">Rentabilidad</h2>
            </div>
            <div className="mt-4 divide-y divide-ink/[0.06]">
              {report.topProducts.map((product) => (
                <div key={product.name} className="py-2.5 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold">{product.name}</p>
                      <p className="text-[10px] text-ink/40">
                        {formatNumber(product.quantity)} u. · costo {formatCOP(product.cost)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-extrabold text-jungle-800">{formatCOP(product.profit)}</p>
                      <p className={`text-[10px] ${product.margin < 0 ? "text-red-600" : "text-ink/40"}`}>
                        {product.margin.toFixed(1)}% margen
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full rounded-full bg-jungle-600"
                      style={{
                        width: `${Math.max(3, Math.min(100, product.revenue > 0 ? (product.revenue / Math.max(...report.topProducts.map((item) => item.revenue), 1)) * 100 : 0))}%`,
                      }}
                    />
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
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Medios de pago</p>
              <h2 className="mt-1 text-xl uppercase">Cobros</h2>
            </div>
            <div className="mt-4 divide-y divide-ink/[0.06]">
              {report.byPaymentMethod.map((method) => (
                <div key={method.method} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div>
                    <p className="text-[12px] font-semibold">{PAYMENT_METHOD_LABELS[method.method] ?? method.method}</p>
                    <p className="text-[10px] text-ink/40">{method.orders} venta{method.orders === 1 ? "" : "s"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-jungle-800">{formatCOP(method.revenue)}</p>
                    <p className="text-[10px] text-ink/40">Ganancia {formatCOP(method.profit)}</p>
                  </div>
                </div>
              ))}
              {report.byPaymentMethod.length === 0 && (
                <p className="py-6 text-center text-sm text-ink/35">Sin cobros en el periodo.</p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Origen</p>
              <h2 className="mt-1 text-xl uppercase">Canales de venta</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {report.channels.map((channel) => (
                <div key={channel.channel} className="rounded-xl bg-cream-100 p-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">
                    {channel.channel === "pos" ? "Caja registradora" : "Tienda web"}
                  </p>
                  <p className="mt-1 font-display text-lg leading-none">{formatCOP(channel.revenue)}</p>
                  <p className="mt-1 text-[10px] text-ink/40">
                    {channel.orders} venta{channel.orders === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
              {report.channels.length === 0 && (
                <p className="col-span-2 py-4 text-center text-sm text-ink/35">Sin ventas en el periodo.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {report.byDay.length > 1 && (
        <section className="admin-card overflow-hidden">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Consolidado</p>
            <h2 className="mt-1 text-xl uppercase">Resumen por día</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Ventas</th>
                  <th>Unidades</th>
                  <th>Ingresos</th>
                  <th>Costo</th>
                  <th>Ganancia bruta</th>
                  <th>Margen</th>
                </tr>
              </thead>
              <tbody>
                {report.byDay.map((day) => (
                  <tr key={day.key}>
                    <td className="text-[11px] font-semibold">{dayLabel(day.key)}</td>
                    <td className="text-[11px] text-ink/55">{day.orders}</td>
                    <td className="text-[11px] text-ink/55">{formatNumber(day.units)}</td>
                    <td className="text-[11px] font-semibold">{formatCOP(day.revenue)}</td>
                    <td className="text-[11px] text-ink/55">{formatCOP(day.cost)}</td>
                    <td className={`text-[11px] font-extrabold ${day.profit < 0 ? "text-red-600" : "text-jungle-800"}`}>
                      {formatCOP(day.profit)}
                    </td>
                    <td className="text-[11px] text-ink/55">{day.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report.byMonth.length > 1 && (
        <section className="admin-card overflow-hidden">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Consolidado</p>
            <h2 className="mt-1 text-xl uppercase">Resumen por mes</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ventas</th>
                  <th>Unidades</th>
                  <th>Ingresos</th>
                  <th>Costo</th>
                  <th>Ganancia bruta</th>
                  <th>Margen</th>
                </tr>
              </thead>
              <tbody>
                {report.byMonth.map((month) => (
                  <tr key={month.key}>
                    <td className="text-[11px] font-semibold">{monthLabel(month.key)}</td>
                    <td className="text-[11px] text-ink/55">{month.orders}</td>
                    <td className="text-[11px] text-ink/55">{formatNumber(month.units)}</td>
                    <td className="text-[11px] font-semibold">{formatCOP(month.revenue)}</td>
                    <td className="text-[11px] text-ink/55">{formatCOP(month.cost)}</td>
                    <td className={`text-[11px] font-extrabold ${month.profit < 0 ? "text-red-600" : "text-jungle-800"}`}>
                      {formatCOP(month.profit)}
                    </td>
                    <td className="text-[11px] text-ink/55">{month.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
