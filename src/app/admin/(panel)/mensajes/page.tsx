import type { Metadata } from "next";
import MessagesManager from "@/components/admin/MessagesManager";
import { listContactMessages } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mensajes · Panel",
};

export default async function AdminMessagesPage() {
  const messages = await listContactMessages();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Bandeja de entrada</p>
        <h1 className="mt-2 text-3xl uppercase sm:text-4xl">Mensajes</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/50">
          Consulta los mensajes enviados desde el formulario de contacto y las consultas de la tienda. Responde por correo o WhatsApp y marca cada mensaje como atendido.
        </p>
      </div>

      <MessagesManager initial={messages} />
    </div>
  );
}
