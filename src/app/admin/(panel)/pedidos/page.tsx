import type { Metadata } from "next";
import OrdersManager from "@/components/admin/OrdersManager";
import { listOrders } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const orders = await listOrders({ limit: 300 });
  return <OrdersManager initialOrders={orders} initialStatus={params.status ?? "all"} />;
}
