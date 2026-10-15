import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Pencil,
  ScanBarcode,
  Truck,
} from "lucide-react";
import { catalogDetail } from "@/lib/catalog";
import { priceLabel, type Product } from "@/lib/catalog-types";
import { dateLabel } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import {
  CatalogState,
  ProductSymbol,
  WhatsappLink,
} from "@/components/catalog-ui";

export const metadata = { title: "Detalle del producto" };

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { id } = await params;
  const product = await catalogDetail<Product>(
    `/products/${encodeURIComponent(id)}`,
  );
  const { guardado } = await searchParams;
  return (
    <>
      <PageHeader
        title="Detalle del producto"
        description="La ficha del catálogo y sus contactos de reposición."
      >
        <Link href="/productos" className="button secondary">
          <ArrowLeft size={15} /> Volver al catálogo
        </Link>
      </PageHeader>
      {guardado && (
        <div
          role="status"
          className="feedback success"
          style={{ marginBottom: 22 }}
        >
          Producto guardado correctamente.
        </div>
      )}
      <div className="product-hero card">
        <ProductSymbol large />
        <div>
          <h1>{product.nombre}</h1>
          <p className="muted">{product.presentacion ?? "Sin presentación"}</p>
          <CatalogState active={product.estado === "ACTIVO"} />
        </div>
        <Link
          href={`/productos/${product.id}/editar`}
          className="button primary"
        >
          <Pencil size={15} /> Editar producto
        </Link>
      </div>
      <div className="catalog-editor">
        <section className="card">
          <h3>Datos del catálogo</h3>
          <div className="key-value">
            <span>Precio de venta por unidad</span>
            <strong>{priceLabel(product.precioVenta)}</strong>
          </div>
          <div className="key-value">
            <span>Stock mínimo de alerta</span>
            <strong>{product.stockMinimo} unidades</strong>
          </div>
          <div className="key-value">
            <span>Última actualización</span>
            <strong>{dateLabel(product.actualizadoEn)}</strong>
          </div>
          <div className="barcode-display">
            <ScanBarcode size={30} strokeWidth={1.2} />
            <div>
              <span className="small muted">Código de barras</span>
              <code>{product.codigoBarras}</code>
            </div>
          </div>
          <div className="callout green small">
            <ClipboardList size={19} />
            <span>
              <strong>Listo para el siguiente paso</strong>La ficha está
              registrada. Las existencias y el historial se habilitarán con el
              módulo de Inventario.
            </span>
          </div>
        </section>
        <section className="card">
          <div className="card-heading">
            <span className="soft-icon">
              <Truck size={21} />
            </span>
            <div>
              <h3>Proveedores asociados</h3>
              <p>Contactos que suministran este producto.</p>
            </div>
          </div>
          {product.proveedores.length ? (
            <div className="contact-links">
              {product.proveedores.map((supplier) => (
                <article key={supplier.id}>
                  <Link
                    href={`/proveedores/${supplier.id}`}
                    className="text-link"
                  >
                    {supplier.nombreContacto} →
                  </Link>
                  <p className="small muted">
                    {supplier.distribuidora ?? "Contacto independiente"}
                    {supplier.estado === "INACTIVO" ? " · Inactivo" : ""}
                  </p>
                  <p className="small">{supplier.telefono}</p>
                  <WhatsappLink phone={supplier.telefono} />
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Truck size={24} />
              <p>
                No tiene proveedores asociados. Puedes agregarlos al editar el
                producto.
              </p>
              <Link
                href={`/productos/${product.id}/editar`}
                className="text-link"
              >
                Asociar proveedores →
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
