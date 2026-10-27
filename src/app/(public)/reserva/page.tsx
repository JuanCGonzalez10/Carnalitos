import { Suspense } from "react";
import type { Metadata } from "next";
import ReservationLookup from "@/components/booking/ReservationLookup";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi reserva",
  description: "Consulta el estado, pagos y saldo de tu reserva en Adrenalina Extrema Huila.",
};

export default async function ReservationPage() {
  const settings = await getSettings();

  return (
    <div className="bg-cream pt-20 sm:pt-24">
      <Suspense
        fallback={
          <div className="container-site flex min-h-[40vh] items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-jungle-600/20 border-t-jungle-600" />
          </div>
        }
      >
        <ReservationLookup
          whatsapp={settings.business.whatsapp}
          checkInTime={settings.booking.checkInTime}
          checkOutTime={settings.booking.checkOutTime}
        />
      </Suspense>
    </div>
  );
}
