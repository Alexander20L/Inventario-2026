import { AuthShell } from "@/components/auth-shell";
import { InvitationAccept } from "@/components/invitation-accept";

export const metadata = { title: "Aceptar invitación" };

export default function AcceptPage() {
  return (
    <AuthShell
      title="Un lugar en el equipo."
      subtitle="Revisa la tienda y el rol que te asignaron. Acepta la invitación para comenzar, sin crear otro negocio."
    >
      <div className="auth-intro">
        <span className="eyebrow">EL EQUIPO CRECE CONTIGO</span>
        <h2>Aceptar invitación</h2>
        <p className="muted">Conecta tu cuenta con la tienda que te invitó.</p>
      </div>
      <InvitationAccept />
    </AuthShell>
  );
}
