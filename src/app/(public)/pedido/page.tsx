import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PageHero from "@/components/shared/PageHero";
import OrderLookup from "@/components/store/OrderLookup";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguir mi pedido",
  description: "Consulta el estado de tu pedido de Carnalitos con el código de compra.",
};

export default function OrderLookupPage() {
  return (
    <>
      <PageHero
        eyebrow="Pedidos"
        title="Sigue tu pedido"
        description="Ingresa el código que te dimos al confirmar la compra y revisa el estado, los productos y la entrega."
        image="/images/brand/page-hero.svg"
      />
      <section className="py-12 sm:py-16">
        <div className="container-site grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">¿Dónde va mi pedido?</p>
            <h2 className="mt-3 text-3xl uppercase sm:text-4xl">Todo en un solo lugar</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink/60">
              El código tiene el formato <strong className="text-jungle-800">CAR-XXXXXXXX</strong> y llega a tu correo
              y a tu WhatsApp cuando registramos la compra. Desde allí puedes ver si está pendiente, en preparación o
              ya salió para entrega.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: "package" as const, title: "Estado actualizado", text: "El equipo de Carnalitos actualiza cada pedido desde el panel." },
                { icon: "truck" as const, title: "Entrega coordinada", text: "Te escribimos por WhatsApp para confirmar la dirección y el pago." },
                { icon: "whatsapp" as const, title: "Soporte directo", text: "Si no encuentras el código, escríbenos y lo buscamos contigo." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-ink/[0.07] bg-white p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jungle-50 text-jungle-700">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink/45">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <OrderLookup />
            <p className="mt-5 text-center text-[11px] text-ink/40">
              ¿Aún no has comprado?{" "}
              <Link href="/tienda" className="font-bold text-jungle-700 hover:underline">
                Visita la tienda
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
