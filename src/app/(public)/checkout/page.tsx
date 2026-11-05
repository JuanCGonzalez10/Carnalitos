import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import CheckoutForm from "@/components/store/CheckoutForm";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();

  return (
    <section className="py-10 sm:py-14">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Último paso</p>
            <h1 className="mt-2 text-4xl uppercase sm:text-5xl">Finalizar compra</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/50">
              Déjanos tus datos de entrega. Confirmaremos el pedido por WhatsApp o correo y coordinaremos el pago.
            </p>
          </div>
          <Link href="/carrito" className="link-arrow">
            <Icon name="chevron-left" className="h-4 w-4" /> Volver al carrito
          </Link>
        </div>

        <div className="mt-8">
          <CheckoutForm store={settings.store} />
        </div>
      </div>
    </section>
  );
}
