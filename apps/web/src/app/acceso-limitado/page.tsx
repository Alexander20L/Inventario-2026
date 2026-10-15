import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { requireUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions";
import { Submit } from "@/components/form-feedback";

export const metadata = { title: "Acceso web limitado" };

export default async function LimitedPage() {
  const user = await requireUser();
  if (user.rol === "ADMINISTRADOR") redirect("/inicio");
  return (
    <AuthShell
      title="Continúa desde la app móvil."
      subtitle="Tu cuenta está orientada al trabajo diario de la tienda. El panel web está reservado a la administración."
    >
      <section className="auth-card limited-card">
        <span className="soft-icon large">
          <Smartphone size={27} />
        </span>
        <h3>
          {user.usuario.nombre.split(" ")[0]}, tu lugar está en el equipo.
        </h3>
        <p className="muted">
          Tu cuenta tiene acceso de trabajador en esta tienda.
        </p>
        <div className="key-value">
          <span>Nombre</span>
          <strong>{user.usuario.nombre}</strong>
        </div>
        <div className="key-value">
          <span>Tienda</span>
          <strong>{user.empresa.nombre}</strong>
        </div>
        <div className="key-value">
          <span>Rol asignado</span>
          <strong>Trabajador</strong>
        </div>
        <div className="callout green small">
          No tienes acceso al panel administrativo ni a los reportes. Cuando
          esté disponible la app móvil, podrás continuar con las tareas
          habilitadas para tu rol.
        </div>
        <form action={logoutAction}>
          <Submit secondary pendingText="Cerrando sesión…">
            Cerrar sesión
          </Submit>
        </form>
      </section>
    </AuthShell>
  );
}
