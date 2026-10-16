import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { ActionLink, PageHeader, ProductArt } from "@/components/ui";

export const metadata = { title: "Inicio" };

export default async function HomePage() {
  const user = await requireUser();
  const isAdmin = user.rol === "ADMINISTRADOR";
  return (
    <>
      <PageHeader
        title={`Buen día, ${user.usuario.nombre.split(" ")[0]}`}
        description={`Este es tu espacio de administración de ${user.empresa.nombre}.`}
      >
        <span className="pill green">
          <span className="status-dot" /> Tienda conectada
        </span>
      </PageHeader>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">
            {isAdmin
              ? "TODO EMPIEZA CON UN BUEN EQUIPO"
              : "TU TIENDA, SIEMPRE A LA MANO"}
          </span>

          <h2>
            {isAdmin
              ? "Tu tienda ya tiene un lugar."
              : "Todo listo para comenzar."}
          </h2>

          <p>
            {isAdmin
              ? "Invita a las personas que trabajan contigo y prepara el siguiente paso de tu negocio."
              : "Consulta el inventario de tu tienda y mantente al tanto de sus existencias."}
          </p>

          {isAdmin ? (
            <Link href="/usuarios/invitaciones" className="button">
              <Users size={16} />
              Invitar a mi equipo
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link href="/inventario" className="button">
              <Package size={16} />
              Ver inventario
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
        <ProductArt />
      </section>
      <section className="grid-3" aria-label="Estado de los módulos">
        <div className="metric-card">
          <div className="metric-label">
            Importe vendido <TrendingUp size={17} />
          </div>
          <div className="metric-value">—</div>
          <p>Disponible al conectar el módulo de ventas.</p>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            Ventas registradas <ShoppingBag size={17} />
          </div>
          <div className="metric-value">—</div>
          <p>Las operaciones aparecerán aquí.</p>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            Productos con stock bajo <Package size={17} />
          </div>
          <div className="metric-value">—</div>
          <p>Disponible al conectar el inventario.</p>
        </div>
      </section>
      <div className="grid-main">
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Prepara tu tienda</h3>
              <p>Un paso a la vez, todo en su lugar.</p>
            </div>
            <span className="pill green">Primeros pasos</span>
          </div>
          <div className="setup-list">
            <div className="setup-item">
              <span className="step-number done">
                <Check size={15} />
              </span>
              <div>
                <h4>Registra tu negocio</h4>
                <p>{user.empresa.nombre} ya está configurada.</p>
              </div>
              <span className="pill green">Listo</span>
            </div>
            <div className="setup-item">
              <span className="step-number">02</span>
              <div>
                <h4>Conecta a tu equipo</h4>
                <p>Invita a tus trabajadores y administra sus accesos.</p>
              </div>
              <ActionLink href="/usuarios">Ver equipo</ActionLink>
            </div>
            <div className="setup-item">
              <span className="step-number">03</span>
              <div>
                <h4>Organiza tus productos</h4>
                <p>Registra el catálogo y sus proveedores.</p>
              </div>
              <ActionLink href="/productos">Ver catálogo</ActionLink>
            </div>
            <div className="setup-item">
              <span className="step-number">04</span>
              <div>
                <h4>Comienza a registrar ventas</h4>
                <p>Las ventas del celular se reflejarán aquí.</p>
              </div>
              <span className="subtle-badge">Próximamente</span>
            </div>
          </div>
        </section>
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Últimas ventas</h3>
              <p>El pulso diario de tu negocio.</p>
            </div>
            <Clock3 size={17} className="muted" />
          </div>
          <div className="empty-state">
            <span className="soft-icon large">
              <ShoppingBag size={26} strokeWidth={1.4} />
            </span>
            <h3>Un espacio para tus ventas</h3>
            <p>
              Cuando conectemos las ventas, podrás consultar aquí sus productos,
              importes y quién las registró.
            </p>
          </div>
          <div className="note-row">
            <Check size={15} />
            <span>
              Solo el administrador puede consultar los reportes del negocio.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
