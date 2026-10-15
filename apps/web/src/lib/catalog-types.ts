export interface SupplierChoice {
  id: string;
  nombreContacto: string;
  distribuidora: string | null;
  telefono: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface Supplier extends SupplierChoice {
  correo: string | null;
  direccion: string | null;
  numeroDocumento: string | null;
  diasVisita: string | null;
  notas: string | null;
  productosCount: number;
}

export interface Product {
  id: string;
  varianteId: string;
  nombre: string;
  presentacion: string | null;
  codigoBarras: string;
  precioVenta: string;
  stockMinimo: number;
  estado: "ACTIVO" | "INACTIVO";
  actualizadoEn: string;
  proveedores: SupplierChoice[];
}

export interface CatalogPage<T> {
  items: T[];
  nextCursor: string | null;
}
export interface SupplierDetail extends Supplier {
  productos: CatalogPage<Product>;
}

export function priceLabel(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value));
}

export function whatsappUrl(phone: string) {
  const clean = phone.replace(/[ ()-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(clean)
    ? `https://wa.me/${clean.slice(1)}`
    : null;
}
