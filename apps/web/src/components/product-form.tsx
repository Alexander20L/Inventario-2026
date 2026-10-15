"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ClipboardList } from "lucide-react";
import { saveProductAction } from "@/lib/catalog-actions";
import {
  priceLabel,
  type CatalogPage,
  type Product,
  type Supplier,
  type SupplierChoice,
} from "@/lib/catalog-types";
import { Feedback, Submit } from "./form-feedback";
import { Field } from "./ui";
import { SupplierPicker } from "./supplier-picker";
import { ProductSymbol } from "./catalog-ui";

export function ProductForm({
  product,
  suppliers,
  selected = [],
}: {
  product?: Product;
  suppliers: CatalogPage<Supplier>;
  selected?: SupplierChoice[];
}) {
  const [state, action] = useActionState(
    saveProductAction.bind(null, product?.id ?? null),
    {},
  );
  const [values, setValues] = useState({
    nombre: product?.nombre ?? "",
    presentacion: product?.presentacion ?? "",
    codigoBarras: product?.codigoBarras ?? "",
    precioVenta: product?.precioVenta ?? "",
    stockMinimo: String(product?.stockMinimo ?? 0),
    estado: product?.estado ?? "ACTIVO",
  });
  function field(
    name:
      | "nombre"
      | "presentacion"
      | "codigoBarras"
      | "precioVenta"
      | "stockMinimo",
  ) {
    return {
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setValues((previous) => ({ ...previous, [name]: event.target.value })),
    };
  }
  return (
    <div className="catalog-editor">
      <section className="card">
        <div className="section-heading">
          <div>
            <h3>{product ? "Datos del producto" : "Un nuevo producto"}</h3>
            <p>Los campos con * son obligatorios.</p>
          </div>
        </div>
        <form action={action} className="form-stack">
          <Feedback state={state} />
          <Field
            name="nombre"
            label="Nombre del producto *"
            required
            maxLength={200}
            placeholder="Por ejemplo, Café molido"
            {...field("nombre")}
          />
          <Field
            name="presentacion"
            label="Presentación"
            maxLength={150}
            placeholder="Por ejemplo, bolsa de 250 g"
            {...field("presentacion")}
          />
          <Field
            name="codigoBarras"
            label="Código de barras *"
            required
            maxLength={64}
            autoComplete="off"
            hint="Se conserva como texto, incluidos los ceros iniciales."
            {...field("codigoBarras")}
          />
          <div className="form-grid">
            <Field
              name="precioVenta"
              label="Precio de venta (S/) *"
              required
              inputMode="decimal"
              placeholder="12.50"
              {...field("precioVenta")}
            />
            <Field
              name="stockMinimo"
              label="Stock mínimo *"
              required
              type="number"
              min={0}
              max={2147483647}
              step={1}
              {...field("stockMinimo")}
            />
          </div>
          <div className="field">
            <label htmlFor="estado">Estado del producto</label>
            <select
              name="estado"
              id="estado"
              value={values.estado}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  estado: event.target.value as "ACTIVO" | "INACTIVO",
                }))
              }
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            <span className="field-hint">
              Desactivarlo conserva el catálogo y sus asociaciones.
            </span>
          </div>
          <SupplierPicker
            initial={suppliers}
            selected={product?.proveedores ?? selected}
          />
          <div className="editor-actions">
            <Link
              className="button secondary"
              href={product ? `/productos/${product.id}` : "/productos"}
            >
              Cancelar
            </Link>
            <Submit pendingText="Guardando producto…">
              {product ? "Guardar cambios" : "Crear producto"}
            </Submit>
          </div>
        </form>
      </section>
      <aside className="editor-aside">
        <section className="card preview-card">
          <h3>Vista previa</h3>
          <div className="product-preview">
            <ProductSymbol large />
            <h2>{values.nombre || "Nombre del producto"}</h2>
            <p className="muted small">
              {values.presentacion || "Presentación opcional"}
            </p>
            <code>{values.codigoBarras || "Código de barras"}</code>
          </div>
          <div className="key-value">
            <span>Precio de venta</span>
            <strong>{priceLabel(values.precioVenta.replace(",", "."))}</strong>
          </div>
          <div className="key-value">
            <span>Stock mínimo</span>
            <strong>{values.stockMinimo || "0"} unidades</strong>
          </div>
          <span className={`pill ${values.estado === "ACTIVO" ? "green" : ""}`}>
            {values.estado === "ACTIVO" ? "Activo" : "Inactivo"}
          </span>
        </section>
        <div className="callout green small">
          <ClipboardList size={20} />
          <span>
            <strong>El stock no se edita aquí</strong>El stock mínimo es un
            umbral de alerta, no una cantidad disponible. Las existencias
            iniciales, reposiciones y ajustes se registrarán desde Inventario.
          </span>
        </div>
      </aside>
    </div>
  );
}
