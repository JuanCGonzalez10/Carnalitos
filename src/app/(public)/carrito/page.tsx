import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import CartView from "@/components/store/CartView";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carrito de compras",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <section className="py-10 sm:py-14">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Tu selección</p>
            <h1 className="mt-2 text-4xl uppercase sm:text-5xl">Carrito</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/50">
              Revisa los productos, ajusta cantidades y finaliza cuando estés listo. Los precios están en pesos colombianos.
            </p>
          </div>
          <Link href="/tienda" className="link-arrow">
            <Icon name="chevron-left" className="h-4 w-4" /> Seguir comprando
          </Link>
        </div>

        <div className="mt-8">
          <CartView store={settings.store} />
        </div>
      </div>
    </section>
  );
}
