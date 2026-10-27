import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { getAdminUser } from "@/lib/auth/session";
import { getDashboardStats, listContactMessages } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/booking/pricing";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function dayAndMonth(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return {
    day: String(date.getUTCDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(date).replace(".", ""),
  };
}

function lastMonths(count: number) {
  const months: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("es-CO", { month: "short" }).format(date).replace(".", ""),
    });
  }
  return months;
}

export default async function AdminDashboardPage() {
  const [user, stats, messages, settings] = await Promise.all([
    getAdminUser(),
    getDashboardStats(),
    listContactMessages(),
    getSettings(),
  ]);

  const unread = messages.filter((message) => message.status === "new").length;
  const months = lastMonths(6);
  const revenueMap = new Map(stats.monthlyRevenue.map((row) => [row.month, row.total]));
  const chart = months.map((month) => ({ ...month, total: revenueMap.get(month.key) ?? 0 }));
  const maxRevenue = Math.max(...chart.map((item) => item.total), 1);
  const integrations = settings.integrations;
  const pendingIntegrations = [
    !integrations.payments.enabled && "pagos en línea",
    !integrations.electronicInvoice.enabled && "facturación electrónica",
    !integrations.email.enabled && "correos automáticos",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Resumen operativo</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Hola, {user?.name?.split(" ")[0] ?? "equipo"}</h1>
          <p className="mt-2 text-sm text-ink/50">
            {new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/glampings/nuevo" className="btn-dark btn-sm">
            <Icon name="plus" className="h-3.5 w-3.5" /> Nuevo glamping
          </Link>
          <Link href="/admin/reportes" className="btn-outline btn-sm">
            <Icon name="chart" className="h-3.5 w-3.5" /> Ver reportes
          </Link>
        </div>
      </div>

      {unread > 0 && (
        <Link href="/admin/mensajes" className="flex items-center justify-between gap-4 rounded-xl border border-sun-400/50 bg-sun-100/60 px-5 py-4 text-sm transition hover:border-sun-500">
          <span className="flex items-center gap-3 font-semibold text-yellow-900">
            <Icon name="mail" className="h-5 w-5" />
            Tienes {unread} mensaje{unread === 1 ? "" : "s"} sin leer de clientes potenciales.
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-900">Revisar →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="money"
          label="Ingresos cobrados"
          value={formatCOP(stats.revenue)}
          sub="Pagos aprobados registrados en el sistema"
          accent="jungle"
        />
        <AdminStatCard
          icon="card"
          label="Saldo por cobrar"
          value={formatCOP(stats.pendingBalance)}
          sub="Reservas activas, confirmadas y completadas"
          accent="sun"
        />
        <AdminStatCard
          icon="bookings"
          label="Reservas este mes"
          value={stats.bookingsThisMonth}
          sub={`${stats.pendingBookings} pendiente${stats.pendingBookings === 1 ? "" : "s"} de confirmar`}
          accent="lime"
        />
        <AdminStatCard
          icon="chart"
          label="Ocupación próximos 30 días"
          value={`${stats.occupancy}%`}
          sub={`${stats.activeGlampings} alojamientos activos`}
          accent="ink"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Reservas activas", value: stats.activeBookings, icon: "calendar" as const, href: "/admin/reservas?status=confirmed" },
          { label: "Clientes registrados", value: stats.customers, icon: "users" as const, href: "/admin/clientes" },
          { label: "Glampings publicados", value: stats.activeGlampings, icon: "tent" as const, href: "/admin/glampings" },
          { label: "Mensajes sin leer", value: unread, icon: "mail" as const, href: "/admin/mensajes" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-white px-4 py-3.5 transition hover:border-jungle-500/40 hover:shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-100 text-jungle-700">
              <Icon name={item.icon} className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink/35">{item.label}</span>
              <span className="block font-display text-xl leading-none">{item.value}</span>
            </span>
            <Icon name="chevron-right" className="h-4 w-4 text-ink/20 transition group-hover:text-jungle-600" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="admin-card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Últimos 6 meses</p>
              <h2 className="mt-1 text-xl uppercase">Ingresos cobrados</h2>
            </div>
            <span className="badge bg-jungle-50 text-jungle-700">{formatCOP(chart.reduce((sum, item) => sum + item.total, 0))}</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">
            {chart.map((item) => (
              <div key={item.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[9px] font-bold text-ink/35">{item.total > 0 ? `${Math.round(item.total / 1000)}k` : "—"}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-jungle-700 to-jungle-500 transition-all hover:from-lime-500 hover:to-lime-400"
                  style={{ height: `${Math.max(4, (item.total / maxRevenue) * 100)}%` }}
                  title={`${item.label}: ${formatCOP(item.total)}`}
                />
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-ink/40">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Agenda</p>
              <h2 className="mt-1 text-xl uppercase">Próximas llegadas</h2>
            </div>
            <Link href="/admin/reservas" className="link-arrow !text-[9px]">Ver todas</Link>
          </div>
          <div className="mt-4 divide-y divide-ink/[0.06]">
            {stats.upcomingBookings.length === 0 && (
              <p className="py-8 text-center text-sm text-ink/35">No hay llegadas programadas.</p>
            )}
            {stats.upcomingBookings.map((booking) => {
              const date = dayAndMonth(booking.checkIn);
              return (
                <Link key={booking.id} href={`/admin/reservas/${booking.id}`} className="flex items-center gap-3 py-3 transition hover:bg-cream-50">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-jungle-950 text-white">
                    <span className="text-[9px] font-bold uppercase text-lime-400">{date.month}</span>
                    <span className="font-display text-sm leading-none">{date.day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold">{booking.guestName}</p>
                    <p className="truncate text-[10px] text-ink/40">{booking.glampingName} · {booking.nights} noches</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Actividad reciente</p>
            <h2 className="mt-1 text-xl uppercase">Últimas reservas</h2>
          </div>
          <Link href="/admin/reservas" className="link-arrow !text-[9px]">Gestionar reservas</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Huésped</th>
                <th>Alojamiento</th>
                <th>Fechas</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="font-mono text-[11px] font-bold">{booking.code}</td>
                  <td>
                    <p className="text-[12px] font-semibold">{booking.guestName}</p>
                    <p className="text-[10px] text-ink/40">{booking.guestEmail}</p>
                  </td>
                  <td className="text-[12px] text-ink/60">{booking.glampingName}</td>
                  <td className="text-[11px] text-ink/50">{formatDate(booking.checkIn)}<br />{formatDate(booking.checkOut)}</td>
                  <td className="text-[12px] font-semibold">{formatCOP(booking.total)}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td className="text-right">
                    <Link href={`/admin/reservas/${booking.id}`} className="text-[10px] font-extrabold uppercase tracking-widest text-jungle-700 hover:underline">Ver</Link>
                  </td>
                </tr>
              ))}
              {stats.recentBookings.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-ink/35">Aún no hay reservas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingIntegrations.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink/45">
                <Icon name="alert" className="h-4 w-4 text-sun-500" /> Integraciones pendientes de configurar
              </p>
              <p className="mt-1 text-sm text-ink/55">
                Falta conectar {pendingIntegrations.join(", ")}. El sistema funciona sin ellas, pero no simula pagos ni facturas DIAN.
              </p>
            </div>
            <Link href="/admin/configuracion" className="btn-outline btn-sm shrink-0">Ver configuración</Link>
          </div>
        </div>
      )}
    </div>
  );
}
