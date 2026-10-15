"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { findSuppliersAction } from "@/lib/catalog-actions";
import type {
  CatalogPage,
  Supplier,
  SupplierChoice,
} from "@/lib/catalog-types";

export function SupplierPicker({
  initial,
  selected: initialSelected,
}: {
  initial: CatalogPage<Supplier>;
  selected: SupplierChoice[];
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [page, setPage] = useState(initial);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function search(more = false) {
    startTransition(async () => {
      const result = await findSuppliersAction(
        more ? appliedQ : q,
        more ? (page.nextCursor ?? undefined) : undefined,
      );
      if (result.error) setError(result.error);
      if (result.page) {
        const found = result.page;
        setPage((previous) =>
          more
            ? { ...found, items: [...previous.items, ...found.items] }
            : found,
        );
        if (!more) setAppliedQ(q);
        setError("");
      }
    });
  }
  return (
    <fieldset className="supplier-picker">
      <legend>Proveedores asociados</legend>
      <p className="field-hint">
        Puedes elegir varios contactos. Se conservan aunque cambies la búsqueda.
      </p>
      <div className="selected-suppliers">
        {selected.map((supplier) => (
          <span className="supplier-chip" key={supplier.id}>
            <input type="hidden" name="proveedorIds" value={supplier.id} />
            {supplier.nombreContacto}
            <button
              type="button"
              aria-label={`Quitar ${supplier.nombreContacto}`}
              onClick={() =>
                setSelected((items) =>
                  items.filter((item) => item.id !== supplier.id),
                )
              }
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="picker-search">
        <input
          aria-label="Buscar proveedores para asociar"
          className="filter-input"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              search();
            }
          }}
          placeholder="Nombre, distribuidora o producto"
          maxLength={120}
        />
        <button
          type="button"
          className="button secondary small-button"
          onClick={() => search()}
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <Search size={15} />
          )}{" "}
          Buscar
        </button>
      </div>
      <div className="supplier-options">
        {page.items.map((supplier) => (
          <label key={supplier.id}>
            <input
              type="checkbox"
              checked={selected.some((item) => item.id === supplier.id)}
              onChange={(event) =>
                setSelected((items) =>
                  event.target.checked
                    ? [...items, supplier]
                    : items.filter((item) => item.id !== supplier.id),
                )
              }
            />
            <span>
              <strong>{supplier.nombreContacto}</strong>
              <small>
                {supplier.distribuidora ?? "Contacto independiente"}
                {supplier.estado === "INACTIVO" ? " · Inactivo" : ""}
              </small>
            </span>
          </label>
        ))}
        {page.items.length === 0 && (
          <p className="small muted">No hay proveedores que coincidan.</p>
        )}
      </div>
      {page.nextCursor && (
        <button
          type="button"
          className="row-action"
          disabled={pending}
          onClick={() => search(true)}
        >
          Cargar más proveedores
        </button>
      )}
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      <Link
        href="/proveedores/nuevo"
        className="text-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Crear un proveedor en otra pestaña ↗
      </Link>
    </fieldset>
  );
}
