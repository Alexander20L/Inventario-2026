import Link from "next/link";
import { MailPlus, ShieldCheck, Smartphone } from "lucide-react";
import { privateApi, requireAdmin } from "@/lib/session";
import type { Member } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { TeamTabs } from "@/components/team-tabs";
import { MembersTable } from "@/components/team-tables";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const user = await requireAdmin();
  const members = await privateApi<Member[]>("/users");
  return (
    <>
      <PageHeader
        title="Usuarios"
        description={`Gestiona el acceso del equipo a ${user.empresa.nombre}.`}
      >
        <Link href="/usuarios/invitaciones" className="button primary">
          <MailPlus size={16} /> Invitar persona
        </Link>
      </PageHeader>
      <TeamTabs />
      <MembersTable initial={members} currentUserId={user.usuario.id} />
      <div className="info-grid">
        <section className="card info-card">
          <span className="soft-icon">
            <ShieldCheck size={20} />
          </span>
          <h3 style={{ marginTop: 17 }}>Administración con claridad</h3>
          <p>
            Los administradores gestionan el catálogo, inventario, ventas,
            reportes, proveedores y accesos de esta tienda, conforme se
            habiliten los módulos.
          </p>
          <span className="pill green">Administrador</span>
        </section>
        <section className="card info-card">
          <span className="soft-icon">
            <Smartphone size={20} />
          </span>
          <h3 style={{ marginTop: 17 }}>Un equipo conectado</h3>
          <p>
            Los trabajadores operarán desde el celular. Deshabilitar su acceso
            conserva las operaciones anteriores y solo afecta a esta tienda.
          </p>
          <span className="pill">Trabajador</span>
        </section>
      </div>
    </>
  );
}
