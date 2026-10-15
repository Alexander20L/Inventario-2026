"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { clearSession, getToken, privateApi, saveSession } from "./session";
import type {
  ActionState,
  AuthResponse,
  Invitation,
  InvitationPreview,
  Member,
} from "./types";

function errorState(error: unknown): ActionState {
  unstable_rethrow(error);
  if (error instanceof ApiError)
    return { error: error.message, empresas: error.empresas };
  return { error: "No se pudo completar la operación. Inténtalo nuevamente." };
}

function fields(form: FormData, names: string[]) {
  return Object.fromEntries(
    names
      .filter((name) => form.has(name))
      .map((name) => [name, form.get(name)]),
  );
}

export async function loginAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let session: AuthResponse;
  try {
    const body = fields(form, ["correo", "password", "empresaId"]);
    if (!body.empresaId) delete body.empresaId;
    session = await api<AuthResponse>("/auth/login", { method: "POST", body });
    await saveSession(session);
  } catch (error) {
    return errorState(error);
  }
  redirect(session.rol === "ADMINISTRADOR" ? "/inicio" : "/acceso-limitado");
}

export async function registerAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const session = await api<AuthResponse>("/auth/register-company", {
      method: "POST",
      body: fields(form, [
        "nombre",
        "correo",
        "password",
        "nombreEmpresa",
        "numeroDocumento",
      ]),
    });
    await saveSession(session);
  } catch (error) {
    return errorState(error);
  }
  redirect("/inicio");
}

export async function previewAction(token: string): Promise<ActionState> {
  try {
    return {
      preview: await api<InvitationPreview>("/auth/invitation-preview", {
        method: "POST",
        body: { token },
      }),
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function acceptAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let session: AuthResponse;
  try {
    session = await api<AuthResponse>("/auth/accept-invitation", {
      method: "POST",
      body: fields(form, ["token", "nombre", "password"]),
    });
    await saveSession(session);
  } catch (error) {
    return errorState(error);
  }
  redirect(session.rol === "ADMINISTRADOR" ? "/inicio" : "/acceso-limitado");
}

export async function logoutAction() {
  const token = await getToken();
  try {
    if (token) await api("/auth/logout", { method: "POST", token });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
  await clearSession();
  redirect("/iniciar-sesion");
}

export async function createInvitationAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const invitation = await privateApi<Invitation & { token: string }>(
      "/invitations",
      { method: "POST", body: fields(form, ["correo", "rol"]) },
    );
    revalidatePath("/usuarios");
    revalidatePath("/usuarios/invitaciones");
    return {
      success:
        "Invitación creada. Copia el enlace y compártelo con su destinatario.",
      invitation,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function revokeInvitationAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = String(form.get("id") ?? "");
  if (!/^[1-9]\d{0,18}$/.test(id)) return { error: "Invitación no válida." };
  try {
    await privateApi(`/invitations/${id}/revoke`, { method: "POST" });
    revalidatePath("/usuarios");
    revalidatePath("/usuarios/invitaciones");
    return { success: "Invitación revocada." };
  } catch (error) {
    return errorState(error);
  }
}

export async function memberStatusAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = String(form.get("id") ?? "");
  if (!/^[1-9]\d{0,18}$/.test(id)) return { error: "Usuario no válido." };
  try {
    await privateApi(`/users/${id}/status`, {
      method: "PATCH",
      body: { estado: form.get("estado") },
    });
    revalidatePath("/usuarios");
    return {
      success:
        form.get("estado") === "INACTIVO"
          ? "Acceso deshabilitado. Su historial se conserva."
          : "Acceso reactivado. La persona puede iniciar sesión nuevamente.",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function loadMembersAction(
  after: string,
): Promise<{ items?: Member[]; error?: string }> {
  try {
    return {
      items: await privateApi<Member[]>(
        `/users?after=${encodeURIComponent(after)}`,
      ),
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function loadInvitationsAction(
  after: string,
): Promise<{ items?: Invitation[]; error?: string }> {
  try {
    return {
      items: await privateApi<Invitation[]>(
        `/invitations?after=${encodeURIComponent(after)}`,
      ),
    };
  } catch (error) {
    return errorState(error);
  }
}
