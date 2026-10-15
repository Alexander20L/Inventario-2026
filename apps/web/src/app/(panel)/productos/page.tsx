import Link from "next/link";
import { Package, Plus, Truck } from "lucide-react";
import { privateApi } from "@/lib/session";
import { catalogQuery } from "@/lib/catalog";
import {
  priceLabel,
  type CatalogPage,
  type Product,
} from "@/lib/catalog-types";
import { PageHeader } from "@/components/ui";
import {
  CatalogFilters,
  CatalogPagination,
  CatalogState,
  ProductSymbol,
} from "@/components/catalog-ui";

export const metadata = { title: "Productos" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = catalogQuery(await searchParams);
  const page = await privateApi<CatalogPage<Product>>(`/products?${query}`);
  return (
    <>
      <PageHeader
        title="Productos"
        description="Administra tu catálogo. Las cantidades se registrarán desde Inventario."
      >
        <Link href="/productos/nuevo" className="button primary">
          <Plus size={16} /> Crear producto
        </Link>
      </PageHeader>
      <CatalogFilters
        path="/productos"
        query={{
          q: query.get("q") ?? "",
          estado: query.get("estado") ?? "",
          proveedorId: query.get("proveedorId") ?? "",
        }}
      />
      {query.has("proveedorId") && (
        <div className="callout green small" style={{ marginBottom: 20 }}>
          <Truck size={17} />
          <span>
            Mostrando productos de un proveedor.{" "}
            <Link href="/productos" className="text-link">
              Ver todo el catálogo
            </Link>
          </span>
        </div>
      )}
      <section className="card table-card">
        <div className="table-card-heading">
          <h3>Catálogo de la tienda</h3>
          <p>Precios de venta por unidad · Código único dentro de tu tienda</p>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Producto y presentación</th>
                <th scope="col">Código de barras</th>
                <th scope="col">Precio</th>
                <th scope="col">Mínimo</th>
                <th scope="col">Estado</th>
                <th scope="col">Proveedores</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="person-cell">
                      <ProductSymbol />
                      <div>
                        <strong>{product.nombre}</strong>
                        <small>
                          {product.presentacion ?? "Sin presentación"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="small">{product.codigoBarras}</code>
                  </td>
                  <td>{priceLabel(product.precioVenta)}</td>
                  <td>{product.stockMinimo} ud.</td>
                  <td>
                    <CatalogState active={product.estado === "ACTIVO"} />
                  </td>
                  <td className="small">
                    {product.proveedores.length ? (
                      <Link
                        href={`/proveedores/${product.proveedores[0].id}`}
                        className="text-link"
                      >
                        {product.proveedores[0].nombreContacto}
                        {product.proveedores.length > 1
                          ? ` +${product.proveedores.length - 1}`
                          : ""}
                      </Link>
                    ) : (
                      <span className="muted">Sin proveedor</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/productos/${product.id}`}
                        className="row-action"
                      >
                        Consultar →
                      </Link>
                      <Link
                        href={`/productos/${product.id}/editar`}
                        className="row-action"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {page.items.length === 0 && (
          <div className="empty-state large-empty">
            <span className="soft-icon large">
              <Package size={28} strokeWidth={1.4} />
            </span>
            <h3>
              {query.size
                ? "No encontramos productos"
                : "Tu catálogo empieza aquí"}
            </h3>
            <p>
              {query.size
                ? "Prueba con otra búsqueda o cambia los filtros."
                : "Registra tu primer producto con su código, precio y proveedores. Después podremos controlar sus existencias."}
            </p>
            <Link href="/productos/nuevo" className="button primary">
              <Plus size={16} /> Crear producto
            </Link>
          </div>
        )}
        <CatalogPagination
          path="/productos"
          query={query.toString()}
          cursor={page.nextCursor}
          count={page.items.length}
        />
      </section>
      <div className="info-grid">
        <section className="card info-card">
          <h3>Los datos del producto</h3>
          <p>
            Nombre, presentación, código, precio y proveedores pertenecen al
            catálogo. Cada producto tiene una variante interna para las futuras
            operaciones de inventario y ventas.
          </p>
        </section>
        <section className="card info-card">
          <h3>El mínimo no es la existencia</h3>
          <p>
            El stock mínimo servirá para las alertas. Editarlo no crea unidades
            ni modifica cantidades disponibles.
          </p>
        </section>
      </div>
    </>
  );
}
