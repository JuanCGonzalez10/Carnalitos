import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingDetail from "@/components/admin/BookingDetail";
import { getBookingById } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle de reserva · Panel",
};

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, settings] = await Promise.all([getBookingById(id), getSettings()]);
  if (!booking) notFound();

  return (
    <BookingDetail
      initial={booking}
      whatsapp={settings.business.whatsapp}
      checkInTime={settings.booking.checkInTime}
      checkOutTime={settings.booking.checkOutTime}
    />
  );
}
