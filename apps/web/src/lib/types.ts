export type Role = "ADMINISTRADOR" | "TRABAJADOR";

export interface CurrentUser {
  usuario: { id: string; nombre: string; correo: string };
  empresa: { id: string; nombre: string };
  rol: Role;
}

export interface AuthResponse {
  accessToken: string;
  expiraEn: string;
  rol: Role;
}

export interface Member {
  id: string;
  usuarioId: string;
  nombre: string;
  correo: string;
  rol: Role;
  estado: "ACTIVO" | "INACTIVO";
}

export interface Invitation {
  id: string;
  correo: string;
  rol: Role;
  estado: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "VENCIDA";
  creadoEn: string;
  expiraEn: string;
}

export interface InvitationPreview {
  tienda: string;
  correo: string;
  rol: Role;
  estado: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "VENCIDA";
  tieneCuenta: boolean;
}

export interface ActionState {
  error?: string;
  success?: string;
  empresas?: { id: string; nombre: string }[];
  invitation?: Invitation & { token: string };
  preview?: InvitationPreview;
}

export function roleLabel(role: Role) {
  return role === "ADMINISTRADOR" ? "Administrador" : "Trabajador";
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}
