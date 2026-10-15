import { Settings2, ShieldCheck, Store, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ActionLink, PageHeader } from "@/components/ui";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader
        title="Configuración"
        description="La información de tu tienda y de tu cuenta de administración."
      />
      <div className="grid-main">
        <div>
          <section className="card">
            <div className="card-heading">
              <span className="soft-icon">
                <Store size={20} />
              </span>
              <div>
                <h3>Datos de la tienda</h3>
                <p>El negocio que estás administrando.</p>
              </div>
            </div>
            <div className="key-value">
              <span>Nombre de la tienda</span>
              <strong>{user.empresa.nombre}</strong>
            </div>
            <div className="key-value">
              <span>Identificador</span>
              <strong>{user.empresa.id}</strong>
            </div>
            <p className="small muted" style={{ marginTop: 18 }}>
              La edición de datos estará disponible en una próxima etapa.
            </p>
          </section>
          <section className="card" style={{ marginTop: 22 }}>
            <div className="card-heading">
              <span className="soft-icon">
                <UserRound size={20} />
              </span>
              <div>
                <h3>Tu perfil</h3>
                <p>Los datos asociados a tu cuenta.</p>
              </div>
            </div>
            <div className="key-value">
              <span>Nombre</span>
              <strong>{user.usuario.nombre}</strong>
            </div>
            <div className="key-value">
              <span>Correo electrónico</span>
              <strong>{user.usuario.correo}</strong>
            </div>
            <div className="key-value">
              <span>Rol en esta tienda</span>
              <span className="pill green">Administrador</span>
            </div>
          </section>
        </div>
        <section className="card info-card" style={{ alignSelf: "start" }}>
          <span className="soft-icon">
            <ShieldCheck size={21} />
          </span>
          <h3 style={{ marginTop: 18 }}>Un espacio independiente</h3>
          <p>
            Los accesos se aplican a esta tienda. Cada persona conserva su
            identidad y puede pertenecer a otros negocios con un rol diferente.
          </p>
          <p>
            Administra las invitaciones y los accesos de tus trabajadores desde
            Usuarios.
          </p>
          <div style={{ marginTop: 20 }}>
            <ActionLink href="/usuarios">Administrar mi equipo</ActionLink>
          </div>
          <Settings2 size={18} className="muted" style={{ marginTop: 25 }} />
        </section>
      </div>
    </>
  );
}
