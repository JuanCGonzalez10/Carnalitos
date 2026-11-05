import type { Metadata } from "next";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { listCategories } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorías · Panel",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await listCategories(true);
  return <CategoriesManager initial={categories} />;
}
