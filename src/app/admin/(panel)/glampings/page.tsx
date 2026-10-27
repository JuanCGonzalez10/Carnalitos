import AdminStatCard from "@/components/admin/AdminStatCard";
import GlampingsAdminList from "@/components/admin/GlampingsAdminList";
import { listGlampings } from "@/lib/data/glampings";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export default async function AdminGlampingsPage() {
  const glampings = await listGlampings(true);
  const active = glampings.filter((item) => item.active);
  const avgPrice = active.length ? Math.round(active.reduce((sum, item) => sum + item.pricePerNight, 0) / active.length) : 0;
  const capacity = active.reduce((sum, item) => sum + item.capacity, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Glampings</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Crea, edita, publica u oculta alojamientos. Cambia precios, capacidad, comodidades, fotos, tarifas y fechas bloqueadas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="tent" label="Alojamientos" value={glampings.length} sub={`${active.length} publicados`} />
        <AdminStatCard icon="users" label="Capacidad total" value={`${capacity} huéspedes`} sub="Suma de alojamientos activos" accent="lime" />
        <AdminStatCard icon="money" label="Tarifa promedio" value={formatCOP(avgPrice)} sub="Por noche, alojamientos activos" accent="sun" />
        <AdminStatCard icon="star" label="Destacados" value={glampings.filter((item) => item.featured).length} sub="Aparecen en la página de inicio" accent="ink" />
      </div>

      <GlampingsAdminList initial={glampings} />
    </div>
  );
}
