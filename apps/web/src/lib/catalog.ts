import "server-only";
import { notFound } from "next/navigation";
import { ApiError } from "./api";
import { privateApi } from "./session";

export function catalogQuery(
  query: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const key of ["q", "estado", "proveedorId", "after"]) {
    if (typeof query[key] === "string" && query[key])
      params.set(key, query[key]);
  }
  return params;
}

export async function catalogDetail<T>(path: string) {
  try {
    return await privateApi<T>(path);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    )
      notFound();
    throw error;
  }
}
