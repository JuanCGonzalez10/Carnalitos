import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderDetail from "@/components/admin/OrderDetail";
import { getOrderById } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle del pedido · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  return <OrderDetail initialOrder={order} />;
}
