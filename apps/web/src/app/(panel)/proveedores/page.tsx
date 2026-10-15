import Link from "next/link";
import { CalendarDays, Phone, Plus, Truck } from "lucide-react";
import { privateApi } from "@/lib/session";
import { catalogQuery } from "@/lib/catalog";
import type { CatalogPage, Supplier } from "@/lib/catalog-types";
import { PageHeader } from "@/components/ui";
import {
  CatalogFilters,
  CatalogPagination,
  CatalogState,
} from "@/components/catalog-ui";

export const metadata = { title: "Proveedores y contactos" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = catalogQuery(await searchParams);
  const page = await privateApi<CatalogPage<Supplier>>(`/suppliers?${query}`);
  return (
    <>
      <PageHeader
        title="Proveedores y contactos"
        description="Organiza a quién contactar para reponer tus productos."
      >
        <Link href="/proveedores/nuevo" className="button primary">
          <Plus size={16} /> Añadir proveedor
        </Link>
      </PageHeader>
      <CatalogFilters
        path="/proveedores"
        query={{ q: query.get("q") ?? "", estado: query.get("estado") ?? "" }}
        suppliers
      />
      {page.items.length ? (
        <div className="supplier-grid">
          {page.items.map((supplier) => (
            <Link
              href={`/proveedores/${supplier.id}`}
              className="card supplier-card"
              key={supplier.id}
            >
              <div className="section-heading">
                <span className="soft-icon">
                  <Truck size={22} />
                </span>
                <CatalogState active={supplier.estado === "ACTIVO"} />
              </div>
              <h3>{supplier.nombreContacto}</h3>
              <p className="muted small">
                {supplier.distribuidora ?? "Contacto independiente"}
              </p>
              <div className="supplier-meta">
                <span>
                  <Phone size={14} /> {supplier.telefono}
                </span>
                <span>
                  <CalendarDays size={14} />{" "}
                  {supplier.diasVisita || "Sin días de visita definidos"}
                </span>
              </div>
              <div className="supplier-card-footer">
                <span>
                  {supplier.productosCount}{" "}
                  {supplier.productosCount === 1
                    ? "producto asociado"
                    : "productos asociados"}
                </span>
                <span className="text-link">Consultar →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="card">
          <div className="empty-state large-empty">
            <span className="soft-icon large">
              <Truck size={28} strokeWidth={1.4} />
            </span>
            <h3>
              {query.size
                ? "No encontramos contactos"
                : "Tu agenda de reposición"}
            </h3>
            <p>
              {query.size
                ? "Busca por nombre del contacto, distribuidora o producto suministrado."
                : "Guarda tus distribuidores y vendedores de ruta para tenerlos a mano cuando necesites mercadería."}
            </p>
            <Link href="/proveedores/nuevo" className="button primary">
              <Plus size={15} /> Añadir proveedor
            </Link>
          </div>
        </section>
      )}
      <CatalogPagination
        path="/proveedores"
        query={query.toString()}
        cursor={page.nextCursor}
        count={page.items.length}
      />
      <div className="callout green small" style={{ marginTop: 25 }}>
        <Truck size={19} />
        <span>
          <strong>Contactar no modifica el inventario</strong>Los productos
          suministrados se asocian desde el catálogo. Las recepciones se
          registrarán como movimientos en Inventario.
        </span>
      </div>
    </>
  );
}
