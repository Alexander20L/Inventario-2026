export interface Branch {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  estado: "ACTIVO" | "INACTIVO";
  creadoEn: string;
  actualizadoEn: string;
}

export interface BranchesResponse {
  items: Branch[];
}

export interface StockProduct {
  productoId: string;
  varianteId: string;
  nombre: string;
  presentacion: string | null;
  variante: string;
  codigoBarras: string | null;
  precioVenta: string;
  stockActual: number;
  stockMinimo: number;
  estado: string;
  actualizadoEn: string;
}

export interface BranchStockResponse {
  sucursal: {
    id: string;
    nombre: string;
    estado: string;
  };
  productos: StockProduct[];
}