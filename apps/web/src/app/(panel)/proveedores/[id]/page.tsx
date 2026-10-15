import Link from "next/link";
import { ArrowLeft, Package, Pencil, Plus, Truck } from "lucide-react";
import { catalogDetail } from "@/lib/catalog";
import { priceLabel, type SupplierDetail } from "@/lib/catalog-types";
import { PageHeader } from "@/components/ui";
import {
  CatalogPagination,
  CatalogState,
  ProductSymbol,
  WhatsappLink,
} from "@/components/catalog-ui";

export const metadata = { title: "Ficha del proveedor" };

export default async function SupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; after?: string }>;
}) {
  const { id } = await params;
  const { guardado, after } = await searchParams;
  const supplier = await catalogDetail<SupplierDetail>(
    `/suppliers/${encodeURIComponent(id)}${after ? `?after=${encodeURIComponent(after)}` : ""}`,
  );
  const details = [
    ["Empresa o distribuidora", supplier.distribuidora],
    ["Teléfono", supplier.telefono],
    ["Correo", supplier.correo],
    ["Documento", supplier.numeroDocumento],
    ["Dirección", supplier.direccion],
    ["Visitas habituales", supplier.diasVisita],
  ];
  return (
    <>
      <PageHeader
        title={supplier.nombreContacto}
        description={
          supplier.distribuidora ?? "Contacto independiente de tu tienda"
        }
      >
        <Link href="/proveedores" className="button secondary">
          <ArrowLeft size={15} /> Volver a contactos
        </Link>
      </PageHeader>
      {guardado && (
        <div
          className="feedback success"
          role="status"
          style={{ marginBottom: 22 }}
        >
          Proveedor guardado correctamente.
        </div>
      )}
      <div className="catalog-editor">
        <section className="card">
          <div className="section-heading">
            <span className="soft-icon large">
              <Truck size={26} />
            </span>
            <CatalogState active={supplier.estado === "ACTIVO"} />
          </div>
          <h3>Datos de contacto</h3>
          {details.map(([label, value]) => (
            <div key={label} className="key-value">
              <span>{label}</span>
              <strong>{value || "No registrado"}</strong>
            </div>
          ))}
          {supplier.notas && (
            <div className="supplier-notes">
              <h4>Notas</h4>
              <p>{supplier.notas}</p>
            </div>
          )}
          <div className="editor-actions">
            <Link
              href={`/proveedores/${supplier.id}/editar`}
              className="button secondary"
            >
              <Pencil size={15} /> Editar contacto
            </Link>
            <WhatsappLink phone={supplier.telefono} />
          </div>
        </section>
        <section className="card table-card">
          <div className="table-card-heading">
            <h3>Productos suministrados</h3>
            <p>{supplier.productosCount} {supplier.productosCount === 1 ? 'producto asociado' : 'productos asociados'} al contacto.</p>
          </div>
          {supplier.productos.items.length ? (
            <div className="supplied-products">
              {supplier.productos.items.map((product) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.id}`}
                  className="supplied-product"
                >
                  <ProductSymbol />
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>
                      {product.presentacion || "Sin presentación"} ·{" "}
                      {priceLabel(product.precioVenta)}
                    </span>
                    <span>
                      Mínimo: {product.stockMinimo} unidades ·{" "}
                      {product.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <span className="text-link">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Package size={25} />
              <h3>Aún sin productos asociados</h3>
              <p>
                Asocia este contacto al crear o editar un producto del catálogo.
              </p>
            </div>
          )}
          <CatalogPagination
            path={`/proveedores/${supplier.id}`}
            query={after ? new URLSearchParams({ after }).toString() : ""}
            cursor={supplier.productos.nextCursor}
            count={supplier.productos.items.length}
          />
          <div style={{ padding: 22 }}>
            <Link
              href={`/productos/nuevo?proveedorId=${supplier.id}`}
              className="button primary"
            >
              <Plus size={15} /> Crear producto asociado
            </Link>
          </div>
        </section>
      </div>
      <div className="callout green small" style={{ marginTop: 24 }}>
        <Truck size={19} />
        <span>
          <strong>Una conversación no es una recepción</strong>WhatsApp permite
          coordinar con el proveedor. Registrar la mercadería recibida será una
          operación de Inventario.
        </span>
      </div>
    </>
  );
}
