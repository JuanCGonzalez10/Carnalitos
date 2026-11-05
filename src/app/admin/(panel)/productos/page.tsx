import type { Metadata } from "next";
import ProductsManager from "@/components/admin/ProductsManager";
import { listCategories, listProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string; editar?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    listProducts({ includeInactive: true }),
    listCategories(true),
  ]);

  return (
    <ProductsManager
      initialProducts={products}
      categories={categories}
      startCreating={params.nuevo === "1"}
      openProductId={params.editar}
      initialStockFilter={params.stock === "low"}
    />
  );
}
