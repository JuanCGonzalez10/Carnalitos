import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { getAdminUser } from "@/lib/auth/session";
import { getDashboardStats, listContactMessages } from "@/lib/data/orders";
import { formatCOP, formatNumber } from "@/lib/store/format";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

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
  const [user, stats, messages] = await Promise.all([
    getAdminUser(),
    getDashboardStats(),
    listContactMessages(),
  ]);

  const unread = messages.filter((message) => message.status === "new").length;
  const months = lastMonths(6);
  const revenueMap = new Map(stats.monthlyRevenue.map((row) => [row.month, row.total]));
  const chart = months.map((month) => ({ ...month, total: revenueMap.get(month.key) ?? 0 }));
  const maxRevenue = Math.max(...chart.map((item) => item.total), 1);
  const chartTotal = chart.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Resumen de la tienda</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Hola, {user?.name?.split(" ")[0] ?? "equipo"}</h1>
          <p className="mt-2 text-sm text-ink/50">
            {new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/productos?nuevo=1" className="btn-dark btn-sm">
            <Icon name="plus" className="h-3.5 w-3.5" /> Nuevo producto
          </Link>
          <Link href="/admin/pedidos" className="btn-outline btn-sm">
            <Icon name="package" className="h-3.5 w-3.5" /> Ver pedidos
          </Link>
        </div>
      </div>

      {unread > 0 && (
        <Link href="/admin/mensajes" className="flex items-center justify-between gap-4 rounded-xl border border-sun-400/50 bg-sun-100/60 px-5 py-4 text-sm transition hover:border-sun-500">
          <span className="flex items-center gap-3 font-semibold text-yellow-900">
            <Icon name="mail" className="h-5 w-5" />
            Tienes {unread} mensaje{unread === 1 ? "" : "s"} sin leer de clientes.
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-900">Revisar →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="money"
          label="Ingresos cobrados"
          value={formatCOP(stats.revenue)}
          sub="Pedidos con pago confirmado"
          accent="jungle"
        />
        <AdminStatCard
          icon="card"
          label="Saldo por cobrar"
          value={formatCOP(stats.pendingBalance)}
          sub="Pedidos activos aún sin pago"
          accent="sun"
        />
        <AdminStatCard
          icon="package"
          label="Pedidos este mes"
          value={formatNumber(stats.ordersThisMonth)}
          sub={`${stats.pendingOrders} pendiente${stats.pendingOrders === 1 ? "" : "s"} de gestionar`}
          accent="lime"
        />
        <AdminStatCard
          icon="chart"
          label="Ticket promedio"
          value={formatCOP(stats.averageTicket)}
          sub={`${stats.customers} cliente${stats.customers === 1 ? "" : "s"} registrado${stats.customers === 1 ? "" : "s"}`}
          accent="ink"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Productos activos", value: stats.activeProducts, icon: "tag" as const, href: "/admin/productos" },
          { label: "Bajo stock", value: stats.lowStock, icon: "alert" as const, href: "/admin/productos?stock=low" },
          { label: "Pedidos pendientes", value: stats.pendingOrders, icon: "truck" as const, href: "/admin/pedidos?status=pending" },
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
              <h2 className="mt-1 text-xl uppercase">Ventas registradas</h2>
            </div>
            <span className="badge bg-jungle-50 text-jungle-700">{formatCOP(chartTotal)}</span>
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
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Inventario</p>
              <h2 className="mt-1 text-xl uppercase">Bajo stock</h2>
            </div>
            <Link href="/admin/productos?stock=low" className="link-arrow !text-[9px]">Ver todos</Link>
          </div>
          <div className="mt-4 divide-y divide-ink/[0.06]">
            {stats.lowStockProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-ink/35">Todo el inventario está en buen nivel.</p>
            )}
            {stats.lowStockProducts.map((product) => (
              <Link key={product.id} href={`/admin/productos?editar=${product.id}`} className="flex items-center gap-3 py-3 transition hover:bg-cream-50">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${product.stock <= 0 ? "bg-red-50 text-red-700" : "bg-sun-100 text-yellow-800"}`}>
                  {product.stock}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold">{product.name}</p>
                  <p className="truncate text-[10px] text-ink/40">{product.categoryName ?? "Sin categoría"} · {product.weight || product.unit}</p>
                </div>
                <Icon name="chevron-right" className="h-4 w-4 text-ink/20" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="admin-card overflow-hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Actividad reciente</p>
              <h2 className="mt-1 text-xl uppercase">Últimos pedidos</h2>
            </div>
            <Link href="/admin/pedidos" className="link-arrow !text-[9px]">Gestionar pedidos</Link>
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-[11px] font-bold">{order.code}</td>
                    <td>
                      <p className="text-[12px] font-semibold">{order.customerName}</p>
                      <p className="text-[10px] text-ink/40">{order.itemsCount ?? 0} artículo{order.itemsCount === 1 ? "" : "s"}</p>
                    </td>
                    <td className="text-[11px] text-ink/50">{formatDate(order.createdAt)}</td>
                    <td className="text-[12px] font-semibold">{formatCOP(order.total)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-right">
                      <Link href={`/admin/pedidos/${order.id}`} className="text-[10px] font-extrabold uppercase tracking-widest text-jungle-700 hover:underline">Ver</Link>
                    </td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-ink/35">Aún no hay pedidos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Ranking</p>
              <h2 className="mt-1 text-xl uppercase">Más vendidos</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {stats.topProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-ink/35">La información aparecerá cuando haya pedidos.</p>
            )}
            {stats.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jungle-950 text-[10px] font-extrabold text-lime-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold">{product.name}</p>
                  <p className="text-[10px] text-ink/40">{product.quantity} unidades</p>
                </div>
                <span className="text-[11px] font-bold text-jungle-800">{formatCOP(product.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
