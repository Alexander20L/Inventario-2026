import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "./api";
import type { AuthResponse, CurrentUser } from "./types";

const COOKIE_NAME = "enstock_session";

export async function getToken() {
  return (await cookies()).get(COOKIE_NAME)?.value;
}

export async function saveSession(session: AuthResponse) {
  (await cookies()).set(COOKIE_NAME, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiraEn),
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    return await api<CurrentUser>("/auth/me", { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/iniciar-sesion?expired=1");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.rol !== "ADMINISTRADOR") redirect("/acceso-limitado");
  return user;
}
export async function userApi<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
) {
  await requireUser();

  try {
    return await api<T>(path, {
      ...options,
      token: await getToken(),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/iniciar-sesion?expired=1");
    }

    if (error instanceof ApiError && error.status === 403) {
      redirect("/acceso-limitado");
    }

    throw error;
  }
}

export async function privateApi<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
) {
  await requireAdmin();
  try {
    return await api<T>(path, { ...options, token: await getToken() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/iniciar-sesion?expired=1");
    if (error instanceof ApiError && error.status === 403)
      redirect("/acceso-limitado");
    throw error;
  }
}
