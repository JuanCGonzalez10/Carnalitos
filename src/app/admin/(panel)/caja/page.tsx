import type { Metadata } from "next";
import CashRegister from "@/components/admin/CashRegister";
import { listProducts } from "@/lib/data/products";
import { getPosTodaySummary } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Caja registradora · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminCashRegisterPage() {
  const [products, summary] = await Promise.all([
    listProducts({ sort: "name" }),
    getPosTodaySummary(),
  ]);

  const inStock = products.filter((product) => product.stock > 0);

  return <CashRegister initialProducts={inStock} initialSummary={summary} />;
}
