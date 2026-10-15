"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Mail, Search, Users } from "lucide-react";
import { loadInvitationsAction, loadMembersAction } from "@/lib/actions";
import {
  dateLabel,
  roleLabel,
  type Invitation,
  type Member,
} from "@/lib/types";
import { MemberStatus, RevokeInvitation } from "./team-controls";

export function MembersTable({
  initial,
  currentUserId,
}: {
  initial: Member[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initial);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [more, setMore] = useState(initial.length === 100);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    setMembers(initial);
    setMore(initial.length === 100);
  }, [initial]);
  const filtered = members.filter(
    (member) =>
      `${member.nombre} ${member.correo}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")) &&
      (!role || member.rol === role) &&
      (!status || member.estado === status),
  );
  return (
    <>
      <div className="filters">
        <div className="search-box">
          <Search size={16} />
          <input
            className="filter-input"
            aria-label="Buscar usuario por nombre o correo"
            placeholder="Buscar por nombre o correo"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por rol"
          className="filter-select"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="TRABAJADOR">Trabajador</option>
        </select>
        <select
          aria-label="Filtrar por acceso"
          className="filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos los accesos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Deshabilitado</option>
        </select>
      </div>
      <section className="card table-card">
        <div className="table-card-heading">
          <h3>Equipo de la tienda</h3>
          <p>
            {members.filter((member) => member.estado === "ACTIVO").length}{" "}
            accesos activos ·{" "}
            {members.filter((member) => member.estado === "INACTIVO").length}{" "}
            deshabilitados entre los registros cargados
          </p>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Nombre y correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Acceso a esta tienda</th>
                <th scope="col">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="person-cell">
                      <span className="avatar">
                        {member.nombre.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{member.nombre}</strong>
                        <small>{member.correo}</small>
                      </div>
                    </div>
                  </td>
                  <td>{roleLabel(member.rol)}</td>
                  <td>
                    <span
                      className={`pill ${member.estado === "ACTIVO" ? "green" : ""}`}
                    >
                      {member.estado === "ACTIVO" ? "Activo" : "Deshabilitado"}
                    </span>
                  </td>
                  <td>
                    {member.usuarioId === currentUserId ? (
                      <span className="small muted">Tu cuenta</span>
                    ) : member.rol === "TRABAJADOR" ? (
                      <MemberStatus member={member} />
                    ) : (
                      <span className="small muted">Administrador</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Users size={25} />
            <h3>No encontramos personas</h3>
            <p>Prueba con otra búsqueda o modifica los filtros.</p>
          </div>
        )}
        <div className="table-footer">
          <span>
            {filtered.length} visibles de {members.length} registros cargados
          </span>
          {more && (
            <button
              className="row-action"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await loadMembersAction(members.at(-1)!.id);
                  if (result.error) setError(result.error);
                  if (result.items) {
                    setMembers((previous) => [
                      ...previous,
                      ...result.items!.filter(
                        (item) =>
                          !previous.some((existing) => existing.id === item.id),
                      ),
                    ]);
                    setMore(result.items.length === 100);
                    setError("");
                  }
                })
              }
            >
              {pending && <LoaderCircle size={13} className="spin" />}
              {pending ? "Cargando…" : "Cargar más"}
            </button>
          )}
        </div>
        {error && (
          <div className="feedback error" role="alert">
            {error}
          </div>
        )}
      </section>
    </>
  );
}

const states = {
  PENDIENTE: { label: "Pendiente", tone: "green" },
  ACEPTADA: { label: "Aceptada", tone: "" },
  REVOCADA: { label: "Revocada", tone: "red" },
  VENCIDA: { label: "Vencida", tone: "amber" },
};

export function InvitationsTable({ initial }: { initial: Invitation[] }) {
  const [invitations, setInvitations] = useState(initial);
  const [more, setMore] = useState(initial.length === 100);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  useEffect(() => {
    setInvitations(initial);
    setMore(initial.length === 100);
  }, [initial]);
  return (
    <section className="card table-card">
      <div className="table-card-heading">
        <h3>Invitaciones de la tienda</h3>
        <p>El estado de cada acceso, siempre a mano.</p>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Correo y rol</th>
              <th scope="col">Estado</th>
              <th scope="col">Vencimiento</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td>
                  <div className="person-cell">
                    <div>
                      <strong>{invitation.correo}</strong>
                      <small>{roleLabel(invitation.rol)}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`pill ${states[invitation.estado].tone}`}>
                    {states[invitation.estado].label}
                  </span>
                </td>
                <td className="small muted">
                  {dateLabel(invitation.expiraEn)}
                </td>
                <td>
                  {invitation.estado === "PENDIENTE" ? (
                    <RevokeInvitation id={invitation.id} />
                  ) : invitation.estado === "ACEPTADA" ? (
                    <Link href="/usuarios" className="row-action">
                      Ver equipo
                    </Link>
                  ) : (
                    <span className="small muted">Crea otra invitación</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {invitations.length === 0 && (
        <div className="empty-state">
          <span className="soft-icon large">
            <Mail size={25} strokeWidth={1.4} />
          </span>
          <h3>El equipo empieza contigo</h3>
          <p>
            Crea tu primera invitación. Aquí podrás consultar su estado y
            revocarla cuando lo necesites.
          </p>
        </div>
      )}
      <div className="table-footer">
        <span>{invitations.length} invitaciones cargadas</span>
        {more && (
          <button
            className="row-action"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await loadInvitationsAction(
                  invitations.at(-1)!.id,
                );
                if (result.error) setError(result.error);
                if (result.items) {
                  setInvitations((previous) => [
                    ...previous,
                    ...result.items!.filter(
                      (item) =>
                        !previous.some((existing) => existing.id === item.id),
                    ),
                  ]);
                  setMore(result.items.length === 100);
                  setError("");
                }
              })
            }
          >
            {pending && <LoaderCircle size={13} className="spin" />}
            {pending ? "Cargando…" : "Cargar más"}
          </button>
        )}
      </div>
      {error && (
        <div className="feedback error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
