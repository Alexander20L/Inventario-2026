"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Package,
  Settings2,
  ShoppingBag,
  Sprout,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";
import { Brand } from "./ui";
import { logoutAction } from "@/lib/actions";
import type { CurrentUser } from "@/lib/types";

const navigation = [
  { href: "/inicio", label: "Inicio", icon: Home },
  {
    href: "/productos",
    label: "Productos",
    icon: Package,
    adminOnly: true,
  },
  { href: "/inventario", label: "Inventario", icon: ClipboardList },
  { href: "/ventas", label: "Ventas", icon: ShoppingBag, adminOnly: true },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: Truck,
    adminOnly: true,
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings2,
    adminOnly: true,
  },
];

export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const visibleNavigation = navigation.filter(
    (item) => !item.adminOnly || user.rol === "ADMINISTRADOR",
  );
  const section =
    visibleNavigation.find((item) => path.startsWith(item.href))?.label ??
    "Inicio";
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <button
          className="menu-toggle"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu size={21} />
        </button>
        <Brand compact />
        <div className="store-switch">
          <Store size={16} />
          <strong>{user.empresa.nombre}</strong>
          <Link href="/iniciar-sesion?cambiar=1">
            Cambiar tienda <ArrowRightLeft size={11} />
          </Link>
        </div>
        <div className="header-account">
          <span className="avatar">
            {user.usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <span className="header-account-name">
            {user.usuario.nombre.split(" ")[0]}{" "}
            <small>
              · {user.rol === "ADMINISTRADOR" ? "Administrador" : "Trabajador"}
            </small>
          </span>
          <form action={logoutAction}>
            <button className="logout-button">
              <LogOut size={13} /> Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <button
        className={`mobile-scrim ${open ? "visible" : ""}`}
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
      />
      <aside
        className={`sidebar ${open ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <div className="close-menu">
          <Brand compact />
          <button onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>
        <span className="sidebar-label">ADMINISTRACIÓN</span>
        <nav>
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`nav-link ${path.startsWith(item.href) ? "active" : ""}`}
              aria-current={path.startsWith(item.href) ? "page" : undefined}
            >
              <item.icon size={17} />
              {item.label}
              {path.startsWith(item.href) && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sprout size={21} strokeWidth={1.4} />
            <strong>Tu tienda, en orden.</strong>Un espacio para tu catálogo,
            tus movimientos y tu equipo.
          </div>
          <div className="sidebar-caption">EN STOCK · Crecemos contigo</div>
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="breadcrumb">
          <Link href="/inicio">Administración</Link>
          <ChevronRight size={10} />
          <span>{section}</span>
          {path.endsWith("/invitaciones") && (
            <>
              <ChevronRight size={10} />
              <span>Invitaciones</span>
            </>
          )}
        </div>
        {children}
        <footer className="dashboard-footer">
          <span>EN STOCK · {user.empresa.nombre}</span>
          <span>Cada movimiento cuenta.</span>
        </footer>
      </main>
    </div>
  );
}
