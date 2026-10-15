"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MessageCircle, Truck } from "lucide-react";
import { saveSupplierAction } from "@/lib/catalog-actions";
import type { Supplier } from "@/lib/catalog-types";
import { Feedback, Submit } from "./form-feedback";
import { Field } from "./ui";

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const [state, action] = useActionState(
    saveSupplierAction.bind(null, supplier?.id ?? null),
    {},
  );
  const [values, setValues] = useState({
    nombreContacto: supplier?.nombreContacto ?? "",
    distribuidora: supplier?.distribuidora ?? "",
    telefono: supplier?.telefono ?? "",
    correo: supplier?.correo ?? "",
    direccion: supplier?.direccion ?? "",
    numeroDocumento: supplier?.numeroDocumento ?? "",
    diasVisita: supplier?.diasVisita ?? "",
    notas: supplier?.notas ?? "",
    estado: supplier?.estado ?? "ACTIVO",
  });
  function field(name: Exclude<keyof typeof values, "estado" | "notas">) {
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
            <h3>
              {supplier ? "Editar contacto" : "Un contacto para tu tienda"}
            </h3>
            <p>Solo nombre y teléfono son obligatorios.</p>
          </div>
        </div>
        <form action={action} className="form-stack">
          <Feedback state={state} />
          <Field
            label="Nombre del contacto *"
            name="nombreContacto"
            autoComplete="name"
            required
            maxLength={150}
            {...field("nombreContacto")}
          />
          <Field
            label="Empresa o distribuidora"
            name="distribuidora"
            autoComplete="organization"
            maxLength={200}
            {...field("distribuidora")}
          />
          <Field
            label="Teléfono / WhatsApp *"
            name="telefono"
            type="tel"
            autoComplete="tel"
            required
            maxLength={30}
            hint="Incluye el código de país para WhatsApp. Ejemplo: +51 999 123 456."
            {...field("telefono")}
          />
          <div className="form-grid">
            <Field
              label="Correo electrónico"
              name="correo"
              type="email"
              autoComplete="email"
              maxLength={150}
              {...field("correo")}
            />
            <Field
              label="Número de documento"
              name="numeroDocumento"
              maxLength={20}
              {...field("numeroDocumento")}
            />
          </div>
          <Field
            label="Dirección"
            name="direccion"
            autoComplete="street-address"
            maxLength={300}
            {...field("direccion")}
          />
          <Field
            label="Días habituales de visita"
            name="diasVisita"
            placeholder="Por ejemplo, martes y viernes"
            maxLength={150}
            {...field("diasVisita")}
          />
          <div className="field">
            <label htmlFor="notas">Notas</label>
            <textarea
              id="notas"
              name="notas"
              rows={4}
              maxLength={1000}
              value={values.notas}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  notas: event.target.value,
                }))
              }
              placeholder="Condiciones de entrega, horarios u observaciones…"
            />
          </div>
          <div className="field">
            <label htmlFor="estado">Estado del proveedor</label>
            <select
              id="estado"
              name="estado"
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
              Desactivarlo conserva sus productos asociados.
            </span>
          </div>
          <div className="editor-actions">
            <Link
              href={supplier ? `/proveedores/${supplier.id}` : "/proveedores"}
              className="button secondary"
            >
              Cancelar
            </Link>
            <Submit pendingText="Guardando contacto…">
              {supplier ? "Guardar cambios" : "Guardar proveedor"}
            </Submit>
          </div>
        </form>
      </section>
      <aside className="editor-aside">
        <section className="card info-card">
          <span className="soft-icon large">
            <Truck size={27} strokeWidth={1.4} />
          </span>
          <h3 style={{ marginTop: 20 }}>Una agenda que ayuda a reponer</h3>
          <p>
            Guarda a tus distribuidores, vendedores de ruta o contactos
            independientes. No es obligatorio que tengan una empresa formal.
          </p>
          <p>
            Después de guardar, podrás vincular este contacto a uno o varios
            productos desde el catálogo.
          </p>
        </section>
        <div className="callout green small">
          <MessageCircle size={20} />
          <span>
            <strong>Conversar no cambia el inventario</strong>Abrir WhatsApp
            solo inicia una conversación. La mercadería recibida se registrará
            en Inventario.
          </span>
        </div>
      </aside>
    </div>
  );
}
