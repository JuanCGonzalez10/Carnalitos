"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils/format";
import type { AdminUser, Settings } from "@/types";

type Message = { type: "ok" | "error"; text: string } | null;

export default function SettingsManager({ initial, user }: { initial: Settings; user: AdminUser }) {
  const router = useRouter();
  const [business, setBusiness] = useState(initial.business);
  const [store, setStore] = useState(initial.store);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);
  const [testingNotifs, setTestingNotifs] = useState(false);
  const [notifResult, setNotifResult] = useState<{
    whatsapp?: { success: boolean; error?: string; provider?: string };
    email?: { success: boolean; error?: string };
    config?: { hasWhatsAppConfig: boolean; hasEmailConfig: boolean; targetPhone: string; targetEmail: string };
  } | null>(null);

  async function testNotifications() {
    setTestingNotifs(true);
    setNotifResult(null);
    try {
      const res = await fetch("/api/admin/test-notifications", { method: "POST" });
      const data = await res.json();
      setNotifResult(data);
    } catch {
      setNotifResult({
        whatsapp: { success: false, error: "Error al invocar la prueba" },
        email: { success: false, error: "Error al invocar la prueba" },
      });
    } finally {
      setTestingNotifs(false);
    }
  }

  async function saveSection(section: "business" | "store") {
    setBusy(section);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section === "business" ? { business } : { store }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la configuración.");
      setMessage({
        type: "ok",
        text: section === "business" ? "Información del negocio guardada." : "Configuración de la tienda guardada.",
      });
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
                <label htmlFor="biz-schedule" className="admin-label">Horario de atención</label>
                <input id="biz-schedule" value={business.schedule} onChange={(event) => setBusiness({ ...business, schedule: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-address" className="admin-label">Dirección</label>
                <input id="biz-address" value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="biz-city" className="admin-label">Ciudad</label>
                <input id="biz-city" value={business.city} onChange={(event) => setBusiness({ ...business, city: event.target.value })} className="admin-input" />
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
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Tienda</p>
              <h2 className="mt-1 text-xl uppercase">Envíos y condiciones</h2>
              <p className="mt-1 text-[11px] text-ink/40">
                Se aplican a los nuevos pedidos. Los cambios no alteran pedidos ya creados.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="store-shipping" className="admin-label">Costo de envío (COP)</label>
                <input
                  id="store-shipping"
                  type="number"
                  min={0}
                  step={500}
                  value={store.shippingCost}
                  onChange={(event) => setStore({ ...store, shippingCost: Number(event.target.value) })}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="store-free" className="admin-label">Envío gratis desde (COP)</label>
                <input
                  id="store-free"
                  type="number"
                  min={0}
                  step={5000}
                  value={store.freeShippingThreshold}
                  onChange={(event) => setStore({ ...store, freeShippingThreshold: Number(event.target.value) })}
                  className="admin-input"
                />
                <p className="mt-1 text-[10px] text-ink/35">Usa 0 para desactivar el envío gratis por monto.</p>
              </div>
              <div>
                <label htmlFor="store-low" className="admin-label">Alerta de bajo stock (unidades)</label>
                <input
                  id="store-low"
                  type="number"
                  min={0}
                  max={9999}
                  value={store.lowStockThreshold}
                  onChange={(event) => setStore({ ...store, lowStockThreshold: Number(event.target.value) })}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="store-currency" className="admin-label">Moneda</label>
                <input id="store-currency" value={store.currency} onChange={(event) => setStore({ ...store, currency: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="store-pickup-address" className="admin-label">Punto de recogida</label>
                <input id="store-pickup-address" value={store.pickupAddress} onChange={(event) => setStore({ ...store, pickupAddress: event.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="store-pickup-schedule" className="admin-label">Horario de recogida</label>
                <input id="store-pickup-schedule" value={store.pickupSchedule} onChange={(event) => setStore({ ...store, pickupSchedule: event.target.value })} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store-delivery" className="admin-label">Nota de entregas</label>
                <textarea id="store-delivery" value={store.deliveryNote} onChange={(event) => setStore({ ...store, deliveryNote: event.target.value })} rows={3} className="admin-textarea" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store-terms" className="admin-label">Condiciones de compra</label>
                <textarea id="store-terms" value={store.terms} onChange={(event) => setStore({ ...store, terms: event.target.value })} rows={5} className="admin-textarea" />
              </div>
            </div>
            <button onClick={() => saveSection("store")} disabled={busy === "store"} className="btn-jungle btn-sm mt-4">
              <Icon name="check" className="h-3.5 w-3.5" /> {busy === "store" ? "Guardando..." : "Guardar configuración"}
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
              Último ingreso: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}
            </p>
          </section>

          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Pagos</p>
            <h2 className="mt-1 text-xl uppercase">Cobro de pedidos</h2>
            <div className="mt-3 space-y-2 text-[11px] leading-5 text-ink/50">
              <p className="flex items-start gap-2">
                <Icon name="money" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" />
                Los pedidos se registran sin cobro automático.
              </p>
              <p className="flex items-start gap-2">
                <Icon name="card" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" />
                Acepta efectivo contraentrega, Nequi, Bancolombia o transferencia.
              </p>
              <p className="flex items-start gap-2">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jungle-600" />
                Marca cada pedido como pagado desde el detalle del pedido.
              </p>
            </div>
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
          <section className="admin-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">Alertas de pedidos</p>
            <h2 className="mt-1 text-xl uppercase">Notificaciones automáticas</h2>
            <p className="mt-1 text-[11px] text-ink/40">
              El servidor envía alertas inmediatas por WhatsApp y correo cuando un cliente finaliza una compra.
            </p>

            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between rounded-lg bg-cream-50 p-2.5">
                <span className="font-semibold text-ink/75">WhatsApp al dueño</span>
                <span className="font-mono text-[11px] text-jungle-800">{business.whatsapp || "+57 310 833 8636"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-cream-50 p-2.5">
                <span className="font-semibold text-ink/75">Correo al dueño</span>
                <span className="font-mono text-[11px] text-jungle-800">{business.email || "carnalitosbarf@gmail.com"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={testNotifications}
              disabled={testingNotifs}
              className="btn-lime btn-sm mt-3 w-full"
            >
              <Icon name="whatsapp" className="h-3.5 w-3.5" />
              {testingNotifs ? "Enviando prueba..." : "Probar notificaciones ahora"}
            </button>

            {notifResult && (
              <div className="mt-3 space-y-2 rounded-xl border border-ink/10 bg-white p-3 text-[11px]">
                <p className="font-bold text-ink">Resultado de la prueba:</p>
                <div>
                  <span className="font-semibold">WhatsApp: </span>
                  {notifResult.whatsapp?.success ? (
                    <span className="text-emerald-700 font-semibold">✓ Enviado con éxito vía {notifResult.whatsapp.provider}</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ No enviado ({notifResult.whatsapp?.error || "Falta CALLMEBOT_API_KEY en .env.local"})</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Correo: </span>
                  {notifResult.email?.success ? (
                    <span className="text-emerald-700 font-semibold">✓ Enviado con éxito a {business.email}</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ No enviado ({notifResult.email?.error || "Falta EMAIL_PASS en .env.local"})</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 rounded-lg border border-dashed border-ink/15 p-2.5 text-[10px] leading-4 text-ink/50 space-y-1">
              <p className="font-bold text-ink/70">¿Cómo activarlas en 1 minuto?</p>
              <p>• <strong>WhatsApp:</strong> Envía <code className="bg-ink/5 px-1 rounded text-ink">I allow callmebot to send me messages</code> a <span className="font-mono text-jungle-700">+34 623 78 64 49</span> (o al alternativo <span className="font-mono text-jungle-700">+34 644 95 42 75</span>) y pon la clave en <code className="bg-ink/5 px-1 rounded text-ink">CALLMEBOT_API_KEY</code> de <code className="bg-ink/5 px-1 rounded text-ink">.env.local</code>.</p>
              <p>• <strong>Gmail:</strong> Genera una Contraseña de Aplicación en <span className="font-mono text-jungle-700">myaccount.google.com/apppasswords</span> y colócala en <code className="bg-ink/5 px-1 rounded text-ink">EMAIL_PASS</code> de <code className="bg-ink/5 px-1 rounded text-ink">.env.local</code>.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
