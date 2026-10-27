import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import AdminStatCard from "@/components/admin/AdminStatCard";
import PrintButton from "@/components/admin/PrintButton";
import { query, queryOne } from "@/lib/db";
import { formatCOP, todayInColombia } from "@/lib/booking/pricing";
import { BOOKING_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reportes · Panel",
};

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const today = todayInColombia();
  const defaultFrom = `${today.slice(0, 7)}-01`;
  const from = one(sp.from) || defaultFrom;
  const to = one(sp.to) || today;

  const [summary, paymentsSummary, monthly, topGlampings, methods, statuses] = await Promise.all([
    queryOne<{ bookings: number; total: number; paid: number; balance: number; avg: number; guests: number }>(
      `select count(*)::int as bookings,
              coalesce(sum(total), 0) as total,
              coalesce(sum(paid_amount), 0) as paid,
              coalesce(sum(balance), 0) as balance,
              coalesce(avg(total), 0) as avg,
              coalesce(sum(guests), 0)::int as guests
       from bookings
       where check_in between $1::date and $2::date and status <> 'cancelled'`,
      [from, to],
    ),
    queryOne<{ collected: number; payments: number }>(
      `select coalesce(sum(amount), 0) as collected, count(*)::int as payments
       from payments
       where status = 'approved' and paid_at between $1::date and $2::date`,
      [from, to],
    ),
    query<{ month: string; revenue: number; bookings: number }>(
      `select to_char(date_trunc('month', b.created_at), 'YYYY-MM') as month,
              coalesce(sum(b.total), 0) as revenue,
              count(*)::int as bookings
       from bookings b
       where b.created_at >= date_trunc('month', current_date) - interval '11 months'
         and b.status <> 'cancelled'
       group by 1 order by 1 asc`,
    ),
    query<{ name: string; bookings: number; total: number; paid: number }>(
      `select g.name, count(b.id)::int as bookings,
              coalesce(sum(b.total), 0) as total,
              coalesce(sum(b.paid_amount), 0) as paid
       from bookings b join glampings g on g.id = b.glamping_id
       where b.check_in between $1::date and $2::date and b.status <> 'cancelled'
       group by g.id, g.name
       order by total desc
       limit 6`,
      [from, to],
    ),
    query<{ method: string; count: number; total: number }>(
      `select method, count(*)::int as count, coalesce(sum(amount), 0) as total
       from payments
       where status = 'approved' and paid_at between $1::date and $2::date
       group by method order by total desc`,
      [from, to],
    ),
    query<{ status: string; count: number }>(
      `select status, count(*)::int as count
       from bookings
       where check_in between $1::date and $2::date
       group by status order by count desc`,
      [from, to],
    ),
  ]);

  const stats = summary ?? { bookings: 0, total: 0, paid: 0, balance: 0, avg: 0, guests: 0 };
  const paidInRange = paymentsSummary?.collected ?? 0;
  const methodTotal = methods.reduce((sum, item) => sum + item.total, 0);
  const maxRevenue = Math.max(...monthly.map((item) => item.revenue), 1);
  const exportParams = new URLSearchParams({ from, to });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Inteligencia del negocio</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Reportes</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Ingresos, reservas y rendimiento por alojamiento. Descarga el detalle en CSV o imprime el resumen ejecutivo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/reports/export?${exportParams.toString()}`} className="btn-dark btn-sm">
            <Icon name="download" className="h-3.5 w-3.5" /> Exportar CSV
          </a>
          <PrintButton label="Imprimir reporte" />
        </div>
      </div>

      <form method="get" className="admin-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="report-from" className="admin-label">Desde</label>
            <input id="report-from" type="date" name="from" defaultValue={from} className="admin-input" />
          </div>
          <div>
            <label htmlFor="report-to" className="admin-label">Hasta</label>
            <input id="report-to" type="date" name="to" defaultValue={to} className="admin-input" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-jungle btn-sm">
              <Icon name="search" className="h-3.5 w-3.5" /> Aplicar
            </button>
            <Link href="/admin/reportes" className="btn-outline btn-sm">Este mes</Link>
          </div>
          <p className="pb-2 text-[11px] text-ink/40 sm:ml-auto">
            Periodo: {formatDate(from)} — {formatDate(to)}
          </p>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="money" label="Ingresos cobrados" value={formatCOP(paidInRange)} sub={`${paymentsSummary?.payments ?? 0} pagos en el periodo`} accent="jungle" />
        <AdminStatCard icon="bookings" label="Reservas" value={stats.bookings} sub={`${stats.guests} huéspedes hospedados`} accent="lime" />
        <AdminStatCard icon="chart" label="Valor reservado" value={formatCOP(stats.total)} sub={`Ticket promedio ${formatCOP(stats.avg)}`} accent="ink" />
        <AdminStatCard icon="card" label="Saldo por cobrar" value={formatCOP(stats.balance)} sub="De reservas del periodo" accent="sun" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="admin-card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Tendencia</p>
              <h2 className="mt-1 text-xl uppercase">Reservas y valor · últimos 12 meses</h2>
            </div>
            <span className="badge bg-cream-100 text-ink/50">Por fecha de creación</span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-1.5 sm:gap-3">
            {monthly.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${monthLabel(item.month)}: ${formatCOP(item.revenue)} · ${item.bookings} reservas`}>
                <span className="text-[8px] font-bold text-ink/35">{item.revenue > 0 ? `${Math.round(item.revenue / 1000)}k` : "—"}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-jungle-700 to-jungle-500 transition hover:from-lime-500 hover:to-lime-400"
                  style={{ height: `${Math.max(3, (item.revenue / maxRevenue) * 100)}%` }}
                />
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-ink/40">{monthLabel(item.month)}</span>
                <span className="text-[8px] text-ink/30">{item.bookings}</span>
              </div>
            ))}
            {monthly.length === 0 && <p className="w-full pb-16 text-center text-sm text-ink/35">Sin datos para graficar.</p>}
          </div>
        </section>

        <section className="admin-card">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Cartera</p>
            <h2 className="mt-1 text-xl uppercase">Métodos de pago</h2>
          </div>
          <div className="mt-4 space-y-3">
            {methods.map((item) => {
              const percent = methodTotal > 0 ? Math.round((item.total / methodTotal) * 100) : 0;
              return (
                <div key={item.method}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">{PAYMENT_METHOD_LABELS[item.method] ?? item.method}</span>
                    <span className="text-ink/50">{formatCOP(item.total)} · {percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-jungle-500" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-0.5 text-[9px] text-ink/30">{item.count} pago{item.count === 1 ? "" : "s"}</p>
                </div>
              );
            })}
            {methods.length === 0 && <p className="py-8 text-center text-sm text-ink/35">No hay pagos registrados en el periodo.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="admin-card overflow-hidden">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Rendimiento</p>
            <h2 className="mt-1 text-xl uppercase">Top alojamientos</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Alojamiento</th>
                  <th>Reservas</th>
                  <th>Valor reservado</th>
                  <th>Cobrado</th>
                  <th className="text-right">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {topGlampings.map((item) => {
                  const percent = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
                  return (
                    <tr key={item.name}>
                      <td className="text-[12px] font-semibold">{item.name}</td>
                      <td className="text-[12px] text-ink/60">{item.bookings}</td>
                      <td className="text-[12px] font-semibold">{formatCOP(item.total)}</td>
                      <td className="text-[12px] text-jungle-700">{formatCOP(item.paid)}</td>
                      <td className="text-right">
                        <span className="badge bg-cream-100 text-ink/55">{percent}%</span>
                      </td>
                    </tr>
                  );
                })}
                {topGlampings.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sm text-ink/35">Sin reservas en el periodo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Operación</p>
            <h2 className="mt-1 text-xl uppercase">Reservas por estado</h2>
          </div>
          <div className="mt-4 space-y-2">
            {statuses.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-3 rounded-lg bg-cream-50 px-3 py-2.5">
                <span className="text-[11px] font-semibold">{BOOKING_STATUS_LABELS[item.status] ?? item.status}</span>
                <span className="badge bg-white text-ink/60">{item.count}</span>
              </div>
            ))}
            {statuses.length === 0 && <p className="py-8 text-center text-sm text-ink/35">Sin reservas en el periodo.</p>}
          </div>
          <div className="mt-5 rounded-lg border border-ink/[0.08] p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-ink/35">Nota contable</p>
            <p className="mt-1 text-[11px] leading-5 text-ink/45">
              Los ingresos cobrados corresponden a pagos aprobados con fecha de pago dentro del periodo. El valor reservado incluye saldos pendientes.
            </p>
          </div>
        </section>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-4 text-[11px] leading-5 text-ink/45">
        <span className="font-bold text-ink/70">Exportación:</span> el archivo CSV incluye el detalle de reservas por fecha de llegada.
        Para contabilidad, cruza los pagos con los comprobantes PDF de cada reserva. Este reporte no reemplaza una factura electrónica validada por la DIAN.
      </div>
    </div>
  );
}
