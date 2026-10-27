import AdminStatCard from "@/components/admin/AdminStatCard";
import ActivitiesManager from "@/components/admin/ActivitiesManager";
import { listActivities } from "@/lib/data/catalog";
import { formatCOP } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const activities = await listActivities(true);
  const active = activities.filter((item) => item.active);
  const avg = active.length ? Math.round(active.reduce((sum, item) => sum + item.price, 0) / active.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Actividades</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Administra las experiencias de aventura: precios, duración, dificultad, cupos, requisitos e imágenes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon="mountain" label="Actividades" value={activities.length} sub={`${active.length} activas`} />
        <AdminStatCard icon="money" label="Precio promedio" value={formatCOP(avg)} sub="Actividades activas" accent="sun" />
        <AdminStatCard icon="star" label="Destacadas" value={activities.filter((item) => item.featured).length} sub="Se muestran en la portada" accent="lime" />
        <AdminStatCard icon="users" label="Categorías" value={new Set(activities.map((item) => item.category)).size} sub="Filtros del catálogo público" accent="ink" />
      </div>

      <ActivitiesManager initial={activities} />
    </div>
  );
}
