import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { LockKeyhole } from "lucide-react";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  return (
    <AuthShell
      title="Tu tienda, en un solo lugar."
      subtitle="Entra a tu espacio de trabajo y encuentra todo lo que necesitas para administrar tu negocio."
    >
      <div className="auth-intro">
        <span className="eyebrow">BIENVENIDO DE NUEVO</span>
        <h2>Iniciar sesión</h2>
        <p className="muted">Accede con la cuenta asociada a tu tienda.</p>
      </div>
      <div className="auth-card">
        <div className="card-heading">
          <span className="soft-icon">
            <LockKeyhole size={19} />
          </span>
          <div>
            <h3>Entra a tu espacio</h3>
            <p>Todo listo para un nuevo día.</p>
          </div>
        </div>
        {expired && (
          <div className="callout amber small">
            Tu sesión venció o ya no está disponible. Vuelve a iniciar sesión.
          </div>
        )}
        <LoginForm />
      </div>
      <p className="auth-footnote">
        <LockKeyhole size={13} /> Tu información, solo para tu tienda.
      </p>
    </AuthShell>
  );
}
