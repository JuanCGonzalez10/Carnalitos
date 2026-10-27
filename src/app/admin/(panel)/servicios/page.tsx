import AdminStatCard from "@/components/admin/AdminStatCard";
import ServicesManager from "@/components/admin/ServicesManager";
import { listServices } from "@/lib/data/catalog";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await listServices(true);
  const active = services.filter((item) => item.active);
  const avg = active.length ? Math.round(active.reduce((sum, item) => sum + item.price, 0) / active.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Servicios adicionales</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Transporte, comidas, decoraciones y otros extras que los huéspedes pueden agregar al reservar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard icon="sparkles" label="Servicios" value={services.length} sub={`${active.length} activos`} />
        <AdminStatCard icon="money" label="Precio promedio" value={formatCOP(avg)} sub="Servicios activos" accent="sun" />
        <AdminStatCard icon="tent" label="Disponibles al reservar" value={active.length} sub="Se muestran en el formulario" accent="lime" />
      </div>

      <ServicesManager initial={services} />
    </div>
  );
}
