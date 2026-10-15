"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ApiError } from "./api";
import { privateApi } from "./session";
import type { ActionState } from "./types";
import type { CatalogPage, Product, Supplier } from "./catalog-types";

function errorState(error: unknown): ActionState {
  unstable_rethrow(error);
  return {
    error:
      error instanceof ApiError
        ? error.message
        : "No pudimos guardar los cambios. Inténtalo nuevamente.",
  };
}

export async function saveProductAction(
  id: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (id !== null && !/^[1-9]\d{0,18}$/.test(id))
    return { error: "Producto no válido." };
  let product: Product;
  try {
    const rawMin = form.get("stockMinimo");
    const body = {
      nombre: form.get("nombre"),
      presentacion: form.get("presentacion"),
      codigoBarras: form.get("codigoBarras"),
      precioVenta: String(form.get("precioVenta") ?? "")
        .trim()
        .replace(",", "."),
      stockMinimo:
        typeof rawMin === "string" && /^\d+$/.test(rawMin)
          ? Number(rawMin)
          : null,
      estado: form.get("estado"),
      proveedorIds: form.getAll("proveedorIds"),
    };
    product = await privateApi<Product>(id ? `/products/${id}` : "/products", {
      method: id ? "PUT" : "POST",
      body,
    });
    revalidatePath("/productos");
    revalidatePath("/productos/[id]", "page");
    revalidatePath("/productos/[id]/editar", "page");
    revalidatePath("/proveedores");
    revalidatePath("/proveedores/[id]", "page");
    revalidatePath("/inicio");
  } catch (error) {
    return errorState(error);
  }
  redirect(`/productos/${product.id}?guardado=1`);
}

export async function saveSupplierAction(
  id: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (id !== null && !/^[1-9]\d{0,18}$/.test(id))
    return { error: "Proveedor no válido." };
  let supplier: Supplier;
  try {
    const body = Object.fromEntries(
      [
        "nombreContacto",
        "distribuidora",
        "telefono",
        "correo",
        "direccion",
        "numeroDocumento",
        "diasVisita",
        "notas",
        "estado",
      ].map((key) => [key, form.get(key)]),
    );
    supplier = await privateApi<Supplier>(
      id ? `/suppliers/${id}` : "/suppliers",
      { method: id ? "PUT" : "POST", body },
    );
    revalidatePath("/proveedores");
    revalidatePath("/proveedores/[id]", "page");
    revalidatePath("/proveedores/[id]/editar", "page");
    revalidatePath("/productos");
    revalidatePath("/productos/[id]", "page");
  } catch (error) {
    return errorState(error);
  }
  redirect(`/proveedores/${supplier.id}?guardado=1`);
}

export async function findSuppliersAction(
  q: string,
  after?: string,
): Promise<{ page?: CatalogPage<Supplier>; error?: string }> {
  try {
    const query = new URLSearchParams({ q });
    if (after) query.set("after", after);
    return {
      page: await privateApi<CatalogPage<Supplier>>(`/suppliers?${query}`),
    };
  } catch (error) {
    return errorState(error);
  }
}
