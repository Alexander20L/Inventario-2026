import Link from "next/link";

export function TeamTabs({ invitations = false }: { invitations?: boolean }) {
  return (
    <nav className="tabs" aria-label="Gestión del equipo">
      <Link
        href="/usuarios"
        className={`tab ${!invitations ? "active" : ""}`}
        aria-current={!invitations ? "page" : undefined}
      >
        Usuarios
      </Link>
      <Link
        href="/usuarios/invitaciones"
        className={`tab ${invitations ? "active" : ""}`}
        aria-current={invitations ? "page" : undefined}
      >
        Invitaciones
      </Link>
    </nav>
  );
}
