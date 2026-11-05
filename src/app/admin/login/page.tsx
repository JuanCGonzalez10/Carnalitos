import { Suspense } from "react";
import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Acceso administrador",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-jungle-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('/images/brand/page-hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-jungle-950 via-jungle-950/70 to-jungle-950/40" />
        <div className="relative">
          <Logo light size="xl" />
          <p className="mt-10 max-w-md text-4xl uppercase leading-[0.95]">
            La tienda de tus mascotas, bien administrada.
          </p>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
            Panel privado para gestionar productos, precios, inventario, pedidos y estadísticas de Carnalitos.
          </p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {[
            { icon: "bag" as const, label: "Pedidos" },
            { icon: "tag" as const, label: "Productos" },
            { icon: "chart" as const, label: "Ventas" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <Icon name={item.icon} className="h-5 w-5 text-lime-400" />
              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-widest text-white/55">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="large" />
          </div>
          <p className="eyebrow">Panel administrativo</p>
          <h1 className="mt-3 text-4xl uppercase">Bienvenido de vuelta</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">
            Ingresa con tu cuenta de administrador para gestionar la operación.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-cream-200" />}>
              <AdminLoginForm />
            </Suspense>
          </div>
          <p className="mt-8 flex items-start gap-2 rounded-xl bg-cream-100 p-4 text-[11px] leading-5 text-ink/45">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-jungle-600" />
            Acceso protegido con sesión segura y límite de intentos. Las credenciales iniciales están documentadas en el README y deben cambiarse.
          </p>
        </div>
      </section>
    </main>
  );
}
