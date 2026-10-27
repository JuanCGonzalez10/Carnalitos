"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { AdminUser, Settings } from "@/types";

type Message = { type: "ok" | "error"; text: string } | null;

export default function SettingsManager({ initial, user }: { initial: Settings; user: AdminUser }) {
  const router = useRouter();
  const [business, setBusiness] = useState(initial.business);
  const [booking, setBooking] = useState(initial.booking);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  const integrations = initial.integrations;

  async function saveSection(section: "business" | "booking") {
    setBusy(section);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section === "business" ? { business } : { booking }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la configuración.");
      setMessage({ type: "ok", text: section === "business" ? "Información del negocio guardada." : "Configuración de reservas guardada." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar la configuración." });
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    if (password.newPassword !== password.confirmPassword) {
      setPasswordMessage({ type: "error", text: "La confirmación no coincide con la nueva contraseña." });
      return;
    }
    if (password.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setBusy("password");
    try {
      const response = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo cambiar la contraseña.");
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage({ type: "ok", text: "Contraseña actualizada. Las demás sesiones se cerraron." });
    } catch (error) {
      setPasswordMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo cambiar la contraseña." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Identidad</p>
              <h2 className="mt-1 text-xl uppercase">Información del negocio</h2>
              <p className="mt-1 text-[11px] text-ink/40">
                Estos datos aparecen en el sitio público, los comprobantes y los enlaces de contacto.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="biz-name" className="admin-label">Nombre</label>
                <input id="biz-name" value={business.name} onChange={(event) => setBusiness({ ...business, name: event.target.value })} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="biz-tagline" className="admin-label">Frase principal</label>
                <input id="biz-tagline" value={business.tagline} onChange={(event) => setBusiness({ ...business, tagline: event.target.value })} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="biz-description" className="admin-label">Descripción</label>
                <textarea id="biz-description" value={business.description} onChange={(event) => setBusiness({ ...business, description: event.target.value })} rows={4} className="admin-textarea" />
              </div>
              <div>
                <label htmlFor="biz-phone" className="admin-label">Teléfono</label>
                <input id="biz-phone" value={business.phone} onChange={(event) => setBusiness({ ...business, phone: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-whatsapp" className="admin-label">WhatsApp (con indicativo)</label>
                <input id="biz-whatsapp" value={business.whatsapp} onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })} placeholder="+573001234567" className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-email" className="admin-label">Correo</label>
                <input id="biz-email" type="email" value={business.email} onChange={(event) => setBusiness({ ...business, email: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-schedule" className="admin-label">Horario</label>
                <input id="biz-schedule" value={business.schedule} onChange={(event) => setBusiness({ ...business, schedule: event.target.value })} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="biz-address" className="admin-label">Dirección</label>
                <input id="biz-address" value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="biz-map" className="admin-label">Búsqueda del mapa</label>
                <input id="biz-map" value={business.mapQuery} onChange={(event) => setBusiness({ ...business, mapQuery: event.target.value })} className="admin-input" />
                <p className="mt-1 text-[10px] text-ink/35">Dirección o lugar que se usa en el mapa embebido de la página de contacto.</p>
              </div>
              <div>
                <label htmlFor="biz-instagram" className="admin-label">Instagram</label>
                <input id="biz-instagram" value={business.instagram} onChange={(event) => setBusiness({ ...business, instagram: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-facebook" className="admin-label">Facebook</label>
                <input id="biz-facebook" value={business.facebook} onChange={(event) => setBusiness({ ...business, facebook: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-tiktok" className="admin-label">TikTok</label>
                <input id="biz-tiktok" value={business.tiktok} onChange={(event) => setBusiness({ ...business, tiktok: event.target.value })} className="admin-input" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-ink/60">
                  <input
                    type="checkbox"
                    checked={business.provisional}
                    onChange={(event) => setBusiness({ ...business, provisional: event.target.checked })}
                    className="h-4 w-4 rounded border-ink/20 text-jungle-600 focus:ring-lime-400"
                  />
                  Contenido provisional visible
                </label>
              </div>
            </div>
            <button onClick={() => saveSection("business")} disabled={busy === "business"} className="btn-jungle btn-sm mt-4">
              <Icon name="check" className="h-3.5 w-3.5" /> {busy === "business" ? "Guardando..." : "Guardar información"}
            </button>
          </section>

          <section className="admin-card">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Reservas</p>
              <h2 className="mt-1 text-xl uppercase">Reglas y condiciones</h2>
              <p className="mt-1 text-[11px] text-ink/40">Aplican a nuevas reservas y al cálculo de anticipos. Los cambios no alteran reservas ya creadas.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="book-deposit" className="admin-label">Anticipo (%)</label>
                <input
                  id="book-deposit"
                  type="number"
                  min={0}
                  max={100}
                  value={booking.depositPercent}
                  onChange={(event) => setBooking({ ...booking, depositPercent: Number(event.target.value) })}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="book-min" className="admin-label">Noches mínimas</label>
                <input
                  id="book-min"
                  type="number"
                  min={1}
                  max={30}
                  value={booking.minNights}
                  onChange={(event) => setBooking({ ...booking, minNights: Number(event.target.value) })}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="book-checkin" className="admin-label">Hora de llegada</label>
                <input id="book-checkin" value={booking.checkInTime} onChange={(event) => setBooking({ ...booking, checkInTime: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="book-checkout" className="admin-label">Hora de salida</label>
                <input id="book-checkout" value={booking.checkOutTime} onChange={(event) => setBooking({ ...booking, checkOutTime: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="book-guests" className="admin-label">Máximo de huéspedes por reserva</label>
                <input
                  id="book-guests"
                  type="number"
                  min={1}
                  max={50}
                  value={booking.maxGuests}
                  onChange={(event) => setBooking({ ...booking, maxGuests: Number(event.target.value) })}
                  className="admin-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="book-terms" className="admin-label">Condiciones y política de cancelación</label>
                <textarea id="book-terms" value={booking.terms} onChange={(event) => setBooking({ ...booking, terms: event.target.value })} rows={5} className="admin-textarea" />
              </div>
            </div>
            <button onClick={() => saveSection("booking")} disabled={busy === "booking"} className="btn-jungle btn-sm mt-4">
              <Icon name="check" className="h-3.5 w-3.5" /> {busy === "booking" ? "Guardando..." : "Guardar reglas"}
            </button>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Cuenta</p>
            <h2 className="mt-1 text-xl uppercase">Tu usuario</h2>
            <div className="mt-3 rounded-lg bg-cream-50 p-3">
              <p className="text-[12px] font-bold">{user.name}</p>
              <p className="text-[10px] text-ink/40">{user.email}</p>
              <span className="badge mt-2 bg-jungle-50 text-jungle-700">{user.role === "admin" ? "Administrador" : "Editor"}</span>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-ink/40">
              Último ingreso: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("es-CO") : "—"}
            </p>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Integraciones</p>
            <h2 className="mt-1 text-xl uppercase">Estado de conexiones</h2>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: "Pagos en línea",
                  provider: integrations.payments.provider,
                  enabled: integrations.payments.enabled,
                  detail: integrations.payments.enabled
                    ? "Credenciales detectadas. El cobro en línea requiere completar el flujo del proveedor."
                    : "Sin configurar. Las reservas se pagan por transferencia o en el sitio.",
                },
                {
                  label: "Facturación electrónica",
                  provider: integrations.electronicInvoice.provider,
                  enabled: integrations.electronicInvoice.enabled,
                  detail: integrations.electronicInvoice.enabled
                    ? "Credenciales detectadas. Falta implementar el mapeo del proveedor."
                    : "Sin configurar. La app no emite facturas DIAN.",
                },
                {
                  label: "Correos automáticos",
                  provider: integrations.email.provider,
                  enabled: integrations.email.enabled,
                  detail: integrations.email.enabled
                    ? "Servidor SMTP detectado."
                    : "Sin configurar. Las confirmaciones se hacen manualmente.",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-ink/[0.08] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold">{item.label}</p>
                    <span className={`badge ${item.enabled ? "bg-lime-100 text-lime-800" : "bg-ink/5 text-ink/45"}`}>
                      {item.enabled ? "Detectada" : "Pendiente"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-5 text-ink/45">{item.detail}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink/30">{item.provider}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-ink/40">
              Las credenciales se configuran en <code className="rounded bg-cream-100 px-1 py-0.5 text-[9px]">.env.local</code>. Consulta la documentación de integraciones del proyecto.
            </p>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Seguridad</p>
            <h2 className="mt-1 text-xl uppercase">Cambiar contraseña</h2>
            <p className="mt-1 text-[10px] leading-5 text-ink/40">
              Usa una contraseña única de al menos 8 caracteres. Al cambiarla se cierran las demás sesiones activas.
            </p>
            <form onSubmit={changePassword} className="mt-3 space-y-3">
              <div>
                <label htmlFor="pwd-current" className="admin-label">Contraseña actual</label>
                <input
                  id="pwd-current"
                  type="password"
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })}
                  className="admin-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="pwd-new" className="admin-label">Nueva contraseña</label>
                <input
                  id="pwd-new"
                  type="password"
                  autoComplete="new-password"
                  value={password.newPassword}
                  onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
                  className="admin-input"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="pwd-confirm" className="admin-label">Confirmar contraseña</label>
                <input
                  id="pwd-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={password.confirmPassword}
                  onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })}
                  className="admin-input"
                  required
                  minLength={8}
                />
              </div>
              {passwordMessage && (
                <p className={`rounded-lg px-3 py-2 text-[11px] ${passwordMessage.type === "ok" ? "bg-jungle-50 text-jungle-800" : "bg-red-50 text-red-700"}`}>
                  {passwordMessage.text}
                </p>
              )}
              <button type="submit" disabled={busy === "password"} className="btn-dark btn-sm w-full">
                <Icon name="shield" className="h-3.5 w-3.5" /> {busy === "password" ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
