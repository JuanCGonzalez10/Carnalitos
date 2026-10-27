import Link from "next/link";
import Icon from "@/components/ui/Icon";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getBookingsSummary, listBookings } from "@/lib/data/bookings";
import { listGlampings } from "@/lib/data/glampings";
import { formatCOP } from "@/lib/booking/pricing";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = one(sp.search);
  const status = one(sp.status);
  const paymentStatus = one(sp.paymentStatus);
  const glampingId = one(sp.glampingId);
  const from = one(sp.from);
  const to = one(sp.to);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const filters = {
    search: search || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    glampingId: glampingId || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const [{ bookings, total }, summary, glampings] = await Promise.all([
    listBookings({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    getBookingsSummary(filters),
    listGlampings(true),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageLink(target: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (glampingId) params.set("glampingId", glampingId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(target));
    return `/admin/reservas?${params.toString()}`;
  }

  const exportParams = new URLSearchParams();
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  if (status) exportParams.set("status", status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Operación</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Reservas</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Busca, filtra y gestiona reservas. Confirma, modifica fechas, registra pagos y descarga comprobantes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/reports/export?${exportParams.toString()}`} className="btn-outline btn-sm">
            <Icon name="download" className="h-3.5 w-3.5" /> Exportar CSV
          </a>
          <Link href="/admin/reportes" className="btn-dark btn-sm">
            <Icon name="chart" className="h-3.5 w-3.5" /> Reportes
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="bookings" label="Reservas encontradas" value={summary.count} sub="Con los filtros actuales" />
        <AdminStatCard icon="money" label="Valor total" value={formatCOP(summary.total)} sub="Suma de reservas filtradas" accent="jungle" />
        <AdminStatCard icon="card" label="Cobrado" value={formatCOP(summary.paid)} sub="Pagos aprobados" accent="lime" />
        <AdminStatCard icon="receipt" label="Saldo pendiente" value={formatCOP(summary.balance)} sub="Por cobrar" accent="sun" />
      </div>

      <form method="get" className="admin-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="filter-search" className="admin-label">Buscar</label>
            <input id="filter-search" name="search" defaultValue={search} placeholder="Código, nombre, correo o teléfono" className="admin-input" />
          </div>
          <div>
            <label htmlFor="filter-status" className="admin-label">Estado de reserva</label>
            <select id="filter-status" name="status" defaultValue={status} className="admin-input">
              <option value="">Todos</option>
              {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-payment" className="admin-label">Estado de pago</label>
            <select id="filter-payment" name="paymentStatus" defaultValue={paymentStatus} className="admin-input">
              <option value="">Todos</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-glamping" className="admin-label">Alojamiento</label>
            <select id="filter-glamping" name="glampingId" defaultValue={glampingId} className="admin-input">
              <option value="">Todos</option>
              {glampings.map((glamping) => (
                <option key={glamping.id} value={glamping.id}>{glamping.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-from" className="admin-label">Llegada desde</label>
            <input id="filter-from" type="date" name="from" defaultValue={from} className="admin-input" />
          </div>
          <div>
            <label htmlFor="filter-to" className="admin-label">Llegada hasta</label>
            <input id="filter-to" type="date" name="to" defaultValue={to} className="admin-input" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-jungle btn-sm flex-1">
              <Icon name="search" className="h-3.5 w-3.5" /> Filtrar
            </button>
            <Link href="/admin/reservas" className="btn-outline btn-sm">Limpiar</Link>
          </div>
        </div>
      </form>

      <div className="admin-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[980px]">
            <thead>
              <tr>
                <th>Código</th>
                <th>Huésped</th>
                <th>Alojamiento</th>
                <th>Fechas</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Saldo</th>
                <th>Reserva</th>
                <th>Pago</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="transition hover:bg-cream-50">
                  <td>
                    <Link href={`/admin/reservas/${booking.id}`} className="font-mono text-[11px] font-bold text-jungle-700 hover:underline">{booking.code}</Link>
                    <p className="mt-0.5 text-[9px] text-ink/30">{formatDate(booking.createdAt)}</p>
                  </td>
                  <td>
                    <p className="text-[12px] font-semibold">{booking.guestName}</p>
                    <p className="text-[10px] text-ink/40">{booking.guestEmail}</p>
                    <p className="text-[10px] text-ink/40">{booking.guestPhone}</p>
                  </td>
                  <td className="text-[11px] text-ink/60">{booking.glampingName}</td>
                  <td className="text-[11px] text-ink/55">
                    {formatDate(booking.checkIn)}<br />{formatDate(booking.checkOut)}
                    <span className="block text-[9px] text-ink/30">{booking.nights} noches · {booking.guests} pers.</span>
                  </td>
                  <td className="text-[12px] font-semibold">{formatCOP(booking.total)}</td>
                  <td className="text-[12px] text-jungle-700">{formatCOP(booking.paidAmount)}</td>
                  <td className={`text-[12px] font-semibold ${booking.balance > 0 ? "text-yellow-800" : "text-ink/35"}`}>{formatCOP(booking.balance)}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td><StatusBadge status={booking.paymentStatus} type="payment" /></td>
                  <td className="text-right">
                    <Link href={`/admin/reservas/${booking.id}`} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-jungle-700 hover:underline">
                      Gestionar <Icon name="arrow" className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-14 text-center">
                    <Icon name="bookings" className="mx-auto h-8 w-8 text-ink/20" />
                    <p className="mt-2 text-sm text-ink/40">No hay reservas con estos filtros.</p>
                    <Link href="/admin/reservas" className="link-arrow mt-3">Ver todas las reservas</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-[11px] text-ink/35">
          Mostrando {bookings.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} de {total} reservas
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={pageLink(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`btn-outline btn-sm ${page <= 1 ? "pointer-events-none opacity-30" : ""}`}
          >
            <Icon name="chevron-left" className="h-3.5 w-3.5" /> Anterior
          </Link>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink/40">Página {page} de {totalPages}</span>
          <Link
            href={pageLink(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`btn-outline btn-sm ${page >= totalPages ? "pointer-events-none opacity-30" : ""}`}
          >
            Siguiente <Icon name="chevron-right" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
