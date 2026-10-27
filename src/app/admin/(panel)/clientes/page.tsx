import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { listCustomers } from "@/lib/data/bookings";
import { formatCOP } from "@/lib/booking/pricing";
import { formatDate, initials } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes · Panel",
};

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = one(sp.search).trim();
  const customers = await listCustomers(search || undefined);

  const withBookings = customers.filter((customer) => (customer.bookingsCount ?? 0) > 0);
  const totalSpent = customers.reduce((sum, customer) => sum + (customer.totalSpent ?? 0), 0);
  const repeat = customers.filter((customer) => (customer.bookingsCount ?? 0) > 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Relación con huéspedes</p>
          <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Consulta el historial de cada huésped, sus reservas y el valor que ha pagado. Los datos se crean automáticamente al reservar.
          </p>
        </div>
        <Link href="/admin/reservas" className="btn-outline btn-sm shrink-0">
          <Icon name="bookings" className="h-3.5 w-3.5" /> Ver reservas
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="users" label="Clientes registrados" value={customers.length} sub="En la base de datos" />
        <AdminStatCard icon="bookings" label="Con reservas" value={withBookings.length} sub="Han reservado al menos una vez" accent="lime" />
        <AdminStatCard icon="star" label="Clientes recurrentes" value={repeat.length} sub="Dos o más reservas" accent="sun" />
        <AdminStatCard icon="money" label="Valor pagado" value={formatCOP(totalSpent)} sub="Pagos aprobados acumulados" accent="jungle" />
      </div>

      <form method="get" className="admin-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="customer-search" className="admin-label">Buscar cliente</label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                id="customer-search"
                name="search"
                defaultValue={search}
                placeholder="Nombre, correo o teléfono"
                className="admin-input pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-jungle btn-sm">
              <Icon name="search" className="h-3.5 w-3.5" /> Buscar
            </button>
            <Link href="/admin/clientes" className="btn-outline btn-sm">Limpiar</Link>
          </div>
        </div>
        {search && (
          <p className="mt-3 text-[11px] text-ink/40">
            {customers.length} resultado{customers.length === 1 ? "" : "s"} para “{search}”.
          </p>
        )}
      </form>

      <div className="admin-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[860px]">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Ciudad</th>
                <th>Reservas</th>
                <th>Valor pagado</th>
                <th>Última reserva</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const whatsapp = `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hola ${customer.fullName}, te escribimos de Adrenalina Extrema Huila.`,
                )}`;
                return (
                  <tr key={customer.id} className="transition hover:bg-cream-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jungle-950 text-[10px] font-extrabold text-lime-400">
                          {initials(customer.fullName) || "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold">{customer.fullName}</p>
                          <p className="text-[9px] text-ink/35">Desde {formatDate(customer.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${customer.email}`} className="block text-[11px] text-jungle-700 hover:underline">{customer.email}</a>
                      <a href={`tel:${customer.phone}`} className="block text-[10px] text-ink/45 hover:underline">{customer.phone || "—"}</a>
                    </td>
                    <td className="text-[11px] text-ink/55">{customer.city || "—"}</td>
                    <td>
                      <span className={`badge ${(customer.bookingsCount ?? 0) > 0 ? "bg-lime-100 text-lime-800" : "bg-ink/5 text-ink/45"}`}>
                        {customer.bookingsCount ?? 0}
                      </span>
                    </td>
                    <td className="text-[12px] font-semibold">{formatCOP(customer.totalSpent ?? 0)}</td>
                    <td className="text-[11px] text-ink/50">{customer.lastBookingAt ? formatDate(customer.lastBookingAt) : "—"}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/reservas?search=${encodeURIComponent(customer.email)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700"
                          title="Ver reservas"
                        >
                          <Icon name="bookings" className="h-4 w-4" />
                        </Link>
                        {customer.phone && (
                          <a
                            href={whatsapp}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-jungle-50 hover:text-jungle-700"
                            title="Escribir por WhatsApp"
                          >
                            <Icon name="whatsapp" className="h-4 w-4" />
                          </a>
                        )}
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/40 transition hover:bg-cream-100 hover:text-jungle-700"
                          title="Enviar correo"
                        >
                          <Icon name="mail" className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Icon name="users" className="mx-auto h-8 w-8 text-ink/20" />
                    <p className="mt-2 text-sm text-ink/40">
                      {search ? "No encontramos clientes con esa búsqueda." : "Aún no hay clientes registrados."}
                    </p>
                    <Link href="/admin/reservas" className="link-arrow mt-3">Revisar reservas</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-ink/35">
        Se muestran hasta 200 clientes. La información personal se usa únicamente para gestionar reservas y comunicaciones del negocio.
      </p>
    </div>
  );
}
