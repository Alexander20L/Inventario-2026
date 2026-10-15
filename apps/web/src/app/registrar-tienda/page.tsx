import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Registrar una tienda" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="El comienzo de tu negocio."
      subtitle="Crea tu espacio y conecta el catálogo, las existencias y las personas que hacen crecer tu tienda."
    >
      <div className="auth-intro">
        <span className="eyebrow">UN NUEVO COMIENZO</span>
        <h2>Registrar una tienda</h2>
        <p className="muted">Tus datos y los de tu negocio, en un solo paso.</p>
      </div>
      <div className="auth-card">
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
