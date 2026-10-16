import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Package,
  Store,
} from "lucide-react";

import { PageHeader } from "@/components/ui";
import { priceLabel } from "@/lib/catalog-types";
import type {
  BranchesResponse,
  BranchStockResponse,
} from "@/lib/inventory-types";
import { userApi } from "@/lib/session";

export const metadata = { title: "Inventario" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const params = await searchParams;

  const branches =
    await userApi<BranchesResponse>("/branches");

  if (branches.items.length === 0) {
    return (
      <>
        <PageHeader
          title="Inventario"
          description="Consulta las existencias de tu tienda por sucursal."
        />

        <section className="card">
          <div className="empty-state large-empty">
            <span className="soft-icon large">
              <Store size={28} strokeWidth={1.4} />
            </span>

            <h3>No hay sucursales registradas</h3>

            <p>
              Necesitas una sucursal para comenzar a
              controlar existencias.
            </p>
          </div>
        </section>
      </>
    );
  }

  const requestedBranch =
    typeof params.sucursal === "string"
      ? params.sucursal
      : undefined;

  const selectedBranch =
    branches.items.find(
      (branch) => branch.id === requestedBranch,
    ) ??
    branches.items.find(
      (branch) => branch.estado === "ACTIVO",
    ) ??
    branches.items[0];

  const stock =
    await userApi<BranchStockResponse>(
      `/inventory/stock/${selectedBranch.id}`,
    );

  const totalProducts = stock.productos.length;

  const totalUnits = stock.productos.reduce(
    (total, product) =>
      total + product.stockActual,
    0,
  );

  const lowStock = stock.productos.filter(
    (product) =>
      product.stockActual <= product.stockMinimo,
  ).length;

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Consulta las existencias disponibles en cada sucursal."
      >
        <span className="pill green">
          <Store size={13} />
          {selectedBranch.nombre}
        </span>
      </PageHeader>

      <section
        className="card"
        style={{ marginBottom: 22 }}
      >
        <div className="section-heading">
          <div>
            <h3>Sucursal</h3>
            <p>
              Selecciona el local cuyo inventario deseas
              consultar.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {branches.items.map((branch) => (
            <Link
              key={branch.id}
              href={`/inventario?sucursal=${branch.id}`}
              className={
                branch.id === selectedBranch.id
                  ? "button primary"
                  : "button"
              }
            >
              <Store size={15} />
              {branch.nombre}

              {branch.estado === "INACTIVO" && (
                <span>· Inactiva</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section
        className="grid-3"
        aria-label="Resumen de inventario"
      >
        <div className="metric-card">
          <div className="metric-label">
            Productos
            <Package size={17} />
          </div>

          <div className="metric-value">
            {totalProducts}
          </div>

          <p>
            Productos registrados en esta sucursal.
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Unidades disponibles
            <Boxes size={17} />
          </div>

          <div className="metric-value">
            {totalUnits}
          </div>

          <p>
            Suma del stock actual de la sucursal.
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Stock bajo
            <AlertTriangle size={17} />
          </div>

          <div className="metric-value">
            {lowStock}
          </div>

          <p>
            Productos en su mínimo o por debajo.
          </p>
        </div>
      </section>

      <section className="card table-card">
        <div className="table-card-heading">
          <h3>Existencias</h3>
          <p>Stock actual de {stock.sucursal.nombre}</p>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Precio</th>
                <th>Stock actual</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {stock.productos.map((product) => {
                const isLow =
                  product.stockActual <=
                  product.stockMinimo;

                return (
                  <tr key={product.varianteId}>
                    <td>
                      <div className="person-cell">
                        <span className="soft-icon">
                          <Package size={17} />
                        </span>

                        <div>
                          <strong>
                            {product.nombre}
                          </strong>

                          <small>
                            {product.presentacion ??
                              "Sin presentación"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {product.codigoBarras ? (
                        <code className="small">
                          {product.codigoBarras}
                        </code>
                      ) : (
                        <span className="muted">
                          Sin código
                        </span>
                      )}
                    </td>

                    <td>
                      {priceLabel(
                        product.precioVenta,
                      )}
                    </td>

                    <td>
                      <strong>
                        {product.stockActual}
                      </strong>{" "}
                      ud.
                    </td>

                    <td>
                      {product.stockMinimo} ud.
                    </td>

                    <td>
                      <span
                        className={
                          isLow
                            ? "pill"
                            : "pill green"
                        }
                      >
                        {isLow
                          ? "Stock bajo"
                          : "Disponible"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {stock.productos.length === 0 && (
          <div className="empty-state large-empty">
            <span className="soft-icon large">
              <Package
                size={28}
                strokeWidth={1.4}
              />
            </span>

            <h3>No hay productos</h3>

            <p>
              Cuando se registren productos aparecerán
              aquí con sus existencias.
            </p>
          </div>
        )}
      </section>
    </>
  );
}