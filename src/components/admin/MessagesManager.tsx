"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils/format";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  read: "Leído",
  replied: "Respondido",
  archived: "Archivado",
};

const FILTERS = ["all", "new", "read", "replied", "archived"] as const;

export default function MessagesManager({ initial }: { initial: ContactMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    return messages.filter((message) => {
      if (filter !== "all" && message.status !== filter) return false;
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      return (
        message.name.toLowerCase().includes(term) ||
        message.email.toLowerCase().includes(term) ||
        message.subject.toLowerCase().includes(term) ||
        message.message.toLowerCase().includes(term)
      );
    });
  }, [messages, filter, search]);

  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter((message) => message.status === "new").length,
      read: messages.filter((message) => message.status === "read").length,
      replied: messages.filter((message) => message.status === "replied").length,
      archived: messages.filter((message) => message.status === "archived").length,
    }),
    [messages],
  );

  async function updateStatus(message: ContactMessage, status: string) {
    setBusyId(message.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el mensaje.");
      setMessages((previous) => previous.map((item) => (item.id === message.id ? { ...item, status } : item)));
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar el mensaje.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-cream-100 p-1">
          {FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition ${
                filter === value ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
              }`}
            >
              {value === "all" ? "Todos" : STATUS_LABELS[value]} ({counts[value]})
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar mensajes"
            className="admin-input pl-9"
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {filtered.map((message) => {
          const whatsapp = `https://wa.me/${message.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hola ${message.name}, gracias por escribir a Carnalitos.`,
          )}`;
          return (
            <article
              key={message.id}
              className={`admin-card transition ${busyId === message.id ? "opacity-50" : ""} ${message.status === "new" ? "border-l-4 border-l-sun-400" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-bold">{message.name}</h2>
                    <span
                      className={`badge ${
                        message.status === "new"
                          ? "bg-sun-100 text-yellow-800"
                          : message.status === "replied"
                            ? "bg-lime-100 text-lime-800"
                            : message.status === "archived"
                              ? "bg-ink/5 text-ink/45"
                              : "bg-cream-100 text-ink/50"
                      }`}
                    >
                      {STATUS_LABELS[message.status] ?? message.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/40">
                    {formatDateTime(message.createdAt)} · {message.email}
                    {message.phone ? ` · ${message.phone}` : ""}
                  </p>
                  {message.subject && <p className="mt-2 text-[12px] font-semibold text-jungle-800">{message.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-[13px] leading-6 text-ink/65">{message.message}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {message.phone && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-jungle btn-sm !px-3" title="Responder por WhatsApp">
                      <Icon name="whatsapp" className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Respuesta a: ${message.subject || "tu mensaje"}`)}`}
                    className="btn-outline btn-sm !px-3"
                    title="Responder por correo"
                  >
                    <Icon name="mail" className="h-3.5 w-3.5" />
                  </a>
                  {message.status !== "replied" && (
                    <button onClick={() => updateStatus(message, "replied")} disabled={busyId === message.id} className="btn-outline btn-sm">
                      <Icon name="check" className="h-3.5 w-3.5" /> Respondido
                    </button>
                  )}
                  {message.status !== "archived" && (
                    <button onClick={() => updateStatus(message, "archived")} disabled={busyId === message.id} className="btn-outline btn-sm !px-3" title="Archivar">
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {message.status === "archived" && (
                    <button onClick={() => updateStatus(message, "read")} disabled={busyId === message.id} className="btn-outline btn-sm">
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="admin-card py-16 text-center">
            <Icon name="mail" className="mx-auto h-8 w-8 text-ink/20" />
            <p className="mt-2 text-sm text-ink/40">
              {search ? "No hay mensajes que coincidan con la búsqueda." : "No hay mensajes en este estado."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
