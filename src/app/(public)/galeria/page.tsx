import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import GalleryGrid from "@/components/shared/GalleryGrid";
import Icon from "@/components/ui/Icon";
import { listGallery } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galería",
  description: "Fotos de glamping, aventura y paisajes del Cañón del Magdalena en el sur del Huila.",
};

export default async function GalleryPage() {
  const [images, settings] = await Promise.all([listGallery(), getSettings()]);
  const instagram = settings.business.instagram;

  return (
    <>
      <PageHero
        eyebrow="Galería"
        title="Así se ve la aventura"
        description="Amaneceres, río, fogata y montaña. Un vistazo a lo que te espera en el cañón."
        image="/images/gal-canon.jpg"
      />

      <section className="py-14 sm:py-20">
        <div className="container-site">
          <GalleryGrid images={images} />

          <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl bg-jungle-950 p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="eyebrow-light">Comparte tu experiencia</p>
              <h2 className="mt-3 text-3xl uppercase">Etiquétanos en tu aventura</h2>
              <p className="mt-2 text-sm text-white/50">Nos encanta ver el cañón con tus ojos.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn-lime">
                  <Icon name="instagram" className="h-4 w-4" /> Instagram
                </a>
              )}
              <Link href="/reservar" className="btn-outline-light">Reservar ahora</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
