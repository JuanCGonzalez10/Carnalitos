"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import Logo from "@/components/brand/Logo";
import { initials } from "@/lib/utils/format";
import type { AdminUser } from "@/types";

const NAV: Array<{ label: string; items: Array<{ href: string; label: string; icon: IconName }> }> = [
  {
    label: "Operación",
    items: [
      { href: "/admin", label: "Panel", icon: "dashboard" },
      { href: "/admin/caja", label: "Caja registradora", icon: "money" },
      { href: "/admin/pedidos", label: "Pedidos", icon: "package" },
      { href: "/admin/mensajes", label: "Mensajes", icon: "mail" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: "tag" },
      { href: "/admin/categorias", label: "Categorías", icon: "grid" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/admin/reportes", label: "Reportes", icon: "chart" },
      { href: "/admin/contabilidad", label: "Contabilidad", icon: "invoice" },
    ],
  },
  {
    label: "Sistema",
    items: [{ href: "/admin/configuracion", label: "Configuración", icon: "settings" }],
  },
];

function sectionTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/admin": "Panel general",
    "/admin/caja": "Caja registradora",
    "/admin/pedidos": "Pedidos",
    "/admin/mensajes": "Mensajes",
    "/admin/productos": "Productos",
    "/admin/categorias": "Categorías",
    "/admin/reportes": "Reportes",
    "/admin/contabilidad": "Contabilidad",
    "/admin/configuracion": "Configuración",
  };
  if (map[pathname]) return map[pathname];
  const base = Object.keys(map)
    .filter((key) => key !== "/admin" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return base ? map[base] : "Panel";
}

export default function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const nav = (
    <>
      <div className="flex h-24 flex-col justify-center gap-1.5 border-b border-white/10 px-5">
        <Logo light compact imageClassName="!h-11" />
        <span className="w-fit rounded bg-lime-400/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-lime-400">
          Admin
        </span>
      </div>

      <nav className="hide-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/25">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-bold transition ${
                      active ? "bg-lime-400 text-ink" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white/45 transition hover:bg-white/[0.06] hover:text-lime-400">
          <Icon name="external" className="h-4 w-4" /> Ver sitio público
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/[0.04] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400 text-[11px] font-extrabold text-ink">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">{user.name}</p>
            <p className="truncate text-[9px] text-white/35">{user.email}</p>
          </div>
          <button onClick={logout} disabled={loggingOut} className="text-white/40 transition hover:text-red-300" aria-label="Cerrar sesión">
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="admin-content min-h-screen bg-cream-100">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-jungle-950 text-white lg:flex">{nav}</aside>

      <div className="lg:pl-64">
        <header className="admin-header sticky top-0 z-30 border-b border-ink/[0.07] bg-cream/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 lg:hidden"
                aria-label="Abrir menú"
              >
                <Icon name="menu" className="h-4 w-4" />
              </button>
              <div className="lg:hidden">
                <Logo compact imageClassName="!h-10" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-ink/35">Administración</p>
                <p className="font-display text-lg uppercase leading-none">{sectionTitle(pathname)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/tienda" target="_blank" className="hidden items-center gap-2 rounded-full border border-ink/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ink/50 transition hover:border-jungle-500 hover:text-jungle-700 sm:flex">
                <Icon name="bag" className="h-3.5 w-3.5" /> Ver tienda
              </Link>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-jungle-950 text-[10px] font-extrabold text-lime-400" title={user.email}>
                {initials(user.name)}
              </span>
            </div>
          </div>
        </header>

        <main className="admin-main p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="admin-footer border-t border-ink/[0.06] px-4 py-5 text-center text-[10px] text-ink/30 sm:px-6 lg:px-8">
          Carnalitos · Panel administrativo · {new Date().getFullYear()}
        </footer>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
          <aside className="relative flex h-full w-[280px] flex-col bg-jungle-950 text-white shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60" aria-label="Cerrar menú">
              <Icon name="close" className="h-4 w-4" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </div>
  );
}
