import type { Metadata } from "next";
import SettingsManager from "@/components/admin/SettingsManager";
import { getAdminUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración · Panel",
};

export default async function AdminSettingsPage() {
  const [settings, user] = await Promise.all([getSettings(), getAdminUser()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Sistema</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Configuración</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Edita la información pública del negocio, las reglas de reserva y revisa el estado de las integraciones externas.
        </p>
      </div>

      {user && <SettingsManager initial={settings} user={user} />}
    </div>
  );
}
