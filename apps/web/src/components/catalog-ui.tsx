import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Package,
  Search,
} from "lucide-react";
import { whatsappUrl } from "@/lib/catalog-types";

export function ProductSymbol({ large = false }: { large?: boolean }) {
  return (
    <span className={`product-symbol ${large ? "large" : ""}`}>
      <Package size={large ? 38 : 22} strokeWidth={1.4} />
    </span>
  );
}

export function CatalogFilters({
  path,
  query,
  suppliers = false,
}: {
  path: string;
  query: { q?: string; estado?: string; proveedorId?: string };
  suppliers?: boolean;
}) {
  return (
    <form action={path} method="get" className="filters">
      {query.proveedorId && (
        <input type="hidden" name="proveedorId" value={query.proveedorId} />
      )}
      <div className="search-box">
        <Search size={16} />
        <input
          name="q"
          aria-label={suppliers ? "Buscar proveedor" : "Buscar producto"}
          className="filter-input"
          defaultValue={query.q ?? ""}
          maxLength={120}
          placeholder={
            suppliers
              ? "Nombre, distribuidora o producto suministrado"
              : "Buscar por nombre, presentación o código"
          }
        />
      </div>
      <select
        name="estado"
        className="filter-select"
        aria-label="Estado"
        defaultValue={query.estado ?? ""}
      >
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Activos</option>
        <option value="INACTIVO">Inactivos</option>
      </select>
      <button className="button secondary small-button" type="submit">
        Buscar
      </button>
      {(query.q || query.estado) && (
        <Link href={path} className="text-link">
          Limpiar
        </Link>
      )}
    </form>
  );
}

export function CatalogPagination({
  path,
  query,
  cursor,
  count,
}: {
  path: string;
  query: string;
  cursor: string | null;
  count: number;
}) {
  const next = new URLSearchParams(query);
  const hasAfter = next.has("after");
  next.delete("after");
  const first = next.toString();
  if (cursor) next.set("after", cursor);
  return (
    <div className="table-footer">
      <span>{count} registros en esta página</span>
      <div className="pagination-actions">
        {hasAfter && (
          <Link
            className="text-link"
            href={`${path}${first ? `?${first}` : ""}`}
          >
            <ArrowLeft size={14} /> Primera página
          </Link>
        )}
        {cursor && (
          <Link className="text-link" href={`${path}?${next}`}>
            Siguiente <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function WhatsappLink({ phone }: { phone: string }) {
  const url = whatsappUrl(phone);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="button primary small-button"
    >
      <MessageCircle size={16} /> Abrir WhatsApp
    </a>
  ) : (
    <p className="small muted">
      Incluye el código de país con + en el teléfono para abrir WhatsApp.
    </p>
  );
}

export function CatalogState({ active }: { active: boolean }) {
  return (
    <span className={`pill ${active ? "green" : ""}`}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
