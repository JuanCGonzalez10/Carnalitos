import AdminStatCard from "@/components/admin/AdminStatCard";
import GalleryManager from "@/components/admin/GalleryManager";
import { listGallery } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await listGallery(true);
  const categories = new Set(images.map((image) => image.category));
  const visible = images.filter((image) => image.active);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Contenido</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Galería</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Sube fotos desde tu computador o celular, organízalas por categorías y decide cuáles se publican.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard icon="image" label="Fotos" value={images.length} sub={`${visible.length} visibles`} />
        <AdminStatCard icon="grid" label="Categorías" value={categories.size} sub="Filtros de la galería pública" accent="lime" />
        <AdminStatCard icon="eye" label="Ocultas" value={images.length - visible.length} sub="No aparecen en el sitio" accent="ink" />
      </div>

      <div className="admin-card">
        <GalleryManager initial={images} />
      </div>
    </div>
  );
}
