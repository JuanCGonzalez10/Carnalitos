import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { CartProvider } from "@/components/store/CartProvider";
import { buildWhatsAppUrl, DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("No se pudo cargar la configuración pública", error);
  }
  const whatsapp = buildWhatsAppUrl(
    settings.business.whatsapp,
    "Hola Carnalitos, quiero información sobre sus snacks para mascotas.",
  );

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-cream">
        <Navbar business={settings.business} store={settings.store} whatsappUrl={whatsapp} />
        <main className="flex-1">{children}</main>
        <Footer business={settings.business} store={settings.store} />
        <WhatsAppButton url={whatsapp} />
      </div>
    </CartProvider>
  );
}
