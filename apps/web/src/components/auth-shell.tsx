import type { ReactNode } from "react";
import { Brand, ProductArt } from "./ui";
import { Check } from "lucide-react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="auth-page">
      <header className="public-header">
        <Brand />
        <span>
          Inventario y ventas <span className="header-divider">/</span> Tu
          tienda, en orden
        </span>
      </header>
      <main className="auth-stage">
        <aside className="auth-story">
          <div>
            <span className="story-eyebrow">
              MENOS COMPLICACIONES. MÁS CONTROL.
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <ProductArt />
          <div className="story-features">
            <span>
              <Check size={15} /> Catálogo claro
            </span>
            <span>
              <Check size={15} /> Movimientos con historial
            </span>
            <span>
              <Check size={15} /> Tu equipo conectado
            </span>
          </div>
          <p className="story-footer">
            Un espacio de administración para cada tienda.
          </p>
        </aside>
        <section className="auth-content">{children}</section>
      </main>
      <footer className="public-footer">
        <span>EN STOCK · Gestión simple para tu negocio</span>
        <span>Hecho para acompañar tu día a día.</span>
      </footer>
    </div>
  );
}
