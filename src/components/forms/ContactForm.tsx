"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const SUBJECTS = ["Pedido o producto", "Envíos y entregas", "Alimentación de mi mascota", "Venta al por mayor", "Otro"];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar el mensaje.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-jungle-600/20 bg-jungle-50 p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-jungle-600 text-white">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h3 className="mt-5 text-2xl uppercase">Mensaje enviado</h3>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Gracias por escribirnos. Te responderemos al correo o WhatsApp que dejaste, normalmente el mismo día.
        </p>
        <button onClick={() => setStatus("idle")} className="btn-jungle mt-6">Enviar otro mensaje</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-ink/[0.08] bg-white p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">Nombre completo *</label>
          <input
            id="contact-name"
            required
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="field"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">Correo *</label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="field"
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="field-label">Teléfono / WhatsApp</label>
          <input
            id="contact-phone"
            type="tel"
            maxLength={30}
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="field"
            placeholder="+57 300 000 0000"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="field-label">Motivo</label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            className="field"
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="contact-message" className="field-label">Mensaje *</label>
        <textarea
          id="contact-message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          className="field resize-y"
          placeholder="Cuéntanos qué necesitas: un pedido, una duda sobre ingredientes o una entrega..."
        />
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn-lime mt-5 w-full sm:w-auto">
        {status === "sending" ? "Enviando..." : "Enviar mensaje"} <Icon name="arrow" className="h-4 w-4" />
      </button>
      <p className="mt-3 text-[11px] leading-5 text-ink/40">
        Usaremos tus datos solo para responder tu solicitud. No compartimos tu información con terceros.
      </p>
    </form>
  );
}
