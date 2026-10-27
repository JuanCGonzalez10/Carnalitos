import { Suspense } from "react";
import type { Metadata } from "next";
import BookingWizard from "@/components/booking/BookingWizard";
import { getImagesForGlampings, listGlampings } from "@/lib/data/glampings";
import { listActivities, listServices } from "@/lib/data/catalog";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservar",
  description: "Reserva tu glamping y actividades en Adrenalina Extrema Huila con disponibilidad en tiempo real.",
};

function WizardFallback() {
  return (
    <div className="container-site flex min-h-[50vh] items-center justify-center py-20">
      <div className="flex items-center gap-3 text-sm text-ink/45">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" />
        Preparando tu reserva...
      </div>
    </div>
  );
}

export default async function BookingPage() {
  const [glampings, activities, services, settings] = await Promise.all([
    listGlampings(),
    listActivities(),
    listServices(),
    getSettings(),
  ]);
  const images = await getImagesForGlampings(glampings.map((glamping) => glamping.id));
  const glampingsWithImages = glampings.map((glamping) => ({
    ...glamping,
    images: images.filter((image) => image.glampingId === glamping.id),
  }));

  return (
    <Suspense fallback={<WizardFallback />}>
      <BookingWizard glampings={glampingsWithImages} activities={activities} services={services} settings={settings} />
    </Suspense>
  );
}
