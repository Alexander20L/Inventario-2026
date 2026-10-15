"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  MailPlus,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import {
  createInvitationAction,
  memberStatusAction,
  revokeInvitationAction,
} from "@/lib/actions";
import type { Member } from "@/lib/types";
import { Field } from "./ui";
import { Feedback, Submit } from "./form-feedback";

export function InviteForm() {
  const [state, action] = useActionState(createInvitationAction, {});
  const [correo, setCorreo] = useState("");
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setCopied(false);
    setLink(
      state.invitation
        ? `${window.location.origin}/aceptar-invitacion#token=${state.invitation.token}`
        : "",
    );
  }, [state.invitation]);
  return (
    <>
      <div className="card-heading">
        <span className="soft-icon">
          <MailPlus size={20} />
        </span>
        <div>
          <h3>Invitar a una persona</h3>
          <p>Un nuevo acceso para tu tienda.</p>
        </div>
      </div>
      <form action={action} className="form-stack">
        <Feedback state={state} />
        <Field
          label="Correo electrónico"
          type="email"
          name="correo"
          placeholder="persona@correo.com"
          autoComplete="off"
          maxLength={150}
          required
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
        <div className="field">
          <label htmlFor="rol">Rol asignado</label>
          <select id="rol" name="rol" defaultValue="TRABAJADOR">
            <option value="TRABAJADOR">Trabajador</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
          <span className="field-hint">
            Administrador permite consultar reportes y gestionar el equipo.
          </span>
        </div>
        <div className="callout green small">
          <ShieldCheck size={17} />
          <span>
            Una persona invitada se suma a esta tienda. No registra un negocio
            nuevo.
          </span>
        </div>
        <Submit pendingText="Creando invitación…">Crear invitación</Submit>
      </form>
      {state.invitation && (
        <div className="invite-result">
          <strong>
            <Link2 size={14} style={{ display: "inline", marginRight: 6 }} />{" "}
            Enlace listo para compartir
          </strong>
          <label className="sr-only" htmlFor="invitation-link">
            Enlace de invitación
          </label>
          <input
            id="invitation-link"
            ref={linkRef}
            value={link}
            readOnly
            onClick={(event) => event.currentTarget.select()}
          />
          <button
            className="button secondary small-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                linkRef.current?.focus();
                linkRef.current?.select();
              }
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
          <p>
            Para {state.invitation.correo}. Vence en 48 horas. Guarda el enlace
            ahora: no se puede recuperar al salir de esta página.
          </p>
          <span role="status" className="sr-only">
            {copied ? "Enlace copiado al portapapeles" : ""}
          </span>
        </div>
      )}
      <div className="form-explainer">
        <h4>Compartir está en tus manos</h4>
        <p>
          Envía el enlace por el canal que prefieras. No se enviará un correo
          automáticamente. Crear otra invitación para el mismo correo revoca la
          anterior.
        </p>
      </div>
    </>
  );
}

export function MemberStatus({ member }: { member: Member }) {
  const [state, action] = useActionState(memberStatusAction, {});
  const dialog = useRef<HTMLDialogElement>(null);
  const active = member.estado === "ACTIVO";
  useEffect(() => {
    if (state.success) dialog.current?.close();
  }, [state]);
  return (
    <>
      <button
        className={`row-action ${active ? "danger-text" : ""}`}
        onClick={() => dialog.current?.showModal()}
      >
        {active ? "Deshabilitar acceso" : "Reactivar acceso"}
      </button>
      <dialog
        ref={dialog}
        className="dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        aria-labelledby={`member-title-${member.id}`}
      >
        <div className="dialog-body">
          <span className="soft-icon">
            {active ? <UserRoundX size={22} /> : <ShieldCheck size={22} />}
          </span>
          <h3 id={`member-title-${member.id}`}>
            {active ? "¿Deshabilitar" : "¿Reactivar"} el acceso de{" "}
            {member.nombre.split(" ")[0]}?
          </h3>
          <p>
            {active
              ? "Perderá el acceso a esta tienda y se cerrarán sus sesiones. Su historial de operaciones se conservará."
              : "Podrá iniciar sesión nuevamente en esta tienda con su cuenta actual."}
          </p>
          {state.error && <Feedback state={state} />}
          <form action={action}>
            <input type="hidden" name="id" value={member.id} />
            <input
              type="hidden"
              name="estado"
              value={active ? "INACTIVO" : "ACTIVO"}
            />
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => dialog.current?.close()}
              >
                Cancelar
              </button>
              <Submit pendingText="Actualizando…">
                {active ? "Deshabilitar" : "Reactivar"}
              </Submit>
            </div>
          </form>
        </div>
      </dialog>
      {state.success && (
        <span className="sr-only" role="status">
          {state.success}
        </span>
      )}
    </>
  );
}

export function RevokeInvitation({ id }: { id: string }) {
  const [state, action] = useActionState(revokeInvitationAction, {});
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.success) dialog.current?.close();
  }, [state]);
  return (
    <>
      <button
        className="row-action danger-text"
        onClick={() => dialog.current?.showModal()}
      >
        Revocar
      </button>
      <dialog
        ref={dialog}
        className="dialog"
        aria-labelledby={`revoke-title-${id}`}
      >
        <div className="dialog-body">
          <h3 id={`revoke-title-${id}`}>¿Revocar esta invitación?</h3>
          <p>
            El enlace dejará de funcionar. Podrás crear una nueva invitación
            cuando lo necesites.
          </p>
          {state.error && <Feedback state={state} />}
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => dialog.current?.close()}
              >
                Cancelar
              </button>
              <Submit pendingText="Revocando…">Revocar invitación</Submit>
            </div>
          </form>
        </div>
      </dialog>
      {state.success && (
        <span role="status" className="sr-only">
          {state.success}
        </span>
      )}
    </>
  );
}
