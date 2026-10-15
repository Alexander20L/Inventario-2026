"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Clock3, Mail, ShieldCheck, Store } from "lucide-react";
import { acceptAction, previewAction } from "@/lib/actions";
import { roleLabel, type ActionState } from "@/lib/types";
import { Field } from "./ui";
import { Feedback, Submit } from "./form-feedback";

function readToken(value: string) {
  if (/^[a-f0-9]{64}$/.test(value.trim())) return value.trim();
  try {
    return new URLSearchParams(new URL(value).hash.slice(1)).get("token") ?? "";
  } catch {
    return "";
  }
}

export function InvitationAccept() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [state, action] = useActionState(acceptAction, {});
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const found = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (!found) return;
    window.history.replaceState(null, "", window.location.pathname);
    setToken(found);
    startTransition(async () => setPreview(await previewAction(found)));
  }, []);

  const invitation = preview.preview;
  return (
    <div className="auth-card">
      <Feedback state={preview} />
      {pending ? (
        <div className="empty-state" role="status">
          <Clock3 size={22} />
          <p>Comprobando tu invitación…</p>
        </div>
      ) : invitation ? (
        <>
          <div className="card-heading">
            <span className="soft-icon">
              <Store size={21} />
            </span>
            <div>
              <h3>Te invitaron a {invitation.tienda}</h3>
              <p>Un lugar en el equipo.</p>
            </div>
          </div>
          <div className="invitation-details">
            <div className="key-value">
              <span>Tienda</span>
              <strong>{invitation.tienda}</strong>
            </div>
            <div className="key-value">
              <span>Rol asignado</span>
              <strong>{roleLabel(invitation.rol)}</strong>
            </div>
            <div className="key-value">
              <span>Correo invitado</span>
              <strong>{invitation.correo}</strong>
            </div>
          </div>
          {invitation.estado === "PENDIENTE" ? (
            <form action={action} className="form-stack">
              <input type="hidden" name="token" value={token} />
              <Feedback state={state} />
              {invitation.tieneCuenta ? (
                <div className="callout green small">
                  <ShieldCheck size={18} />
                  <span>
                    Ya tienes una cuenta. Introduce tu contraseña actual para
                    aceptar el acceso a esta tienda.
                  </span>
                </div>
              ) : (
                <Field
                  name="nombre"
                  label="Tu nombre"
                  autoComplete="name"
                  required
                  maxLength={150}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              )}
              <Field
                label="Correo electrónico"
                type="email"
                name="correo"
                value={invitation.correo}
                readOnly
              />
              <Field
                name="password"
                label={
                  invitation.tieneCuenta
                    ? "Contraseña actual"
                    : "Crear contraseña"
                }
                type="password"
                autoComplete={
                  invitation.tieneCuenta ? "current-password" : "new-password"
                }
                minLength={10}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={
                  invitation.tieneCuenta
                    ? undefined
                    : "Usa entre 10 y 128 caracteres."
                }
              />
              <p className="small muted">
                {invitation.rol === "TRABAJADOR"
                  ? "Con el rol de trabajador tendrás acceso a la operación móvil, sin acceso al panel administrativo."
                  : "Tendrás acceso al panel y a la administración de esta tienda."}
              </p>
              <Submit pendingText="Aceptando invitación…">
                {invitation.tieneCuenta
                  ? "Aceptar con mi cuenta"
                  : "Crear cuenta y aceptar"}
              </Submit>
            </form>
          ) : (
            <div className="callout amber small">
              <Clock3 size={19} />
              <span>
                {invitation.estado === "ACEPTADA"
                  ? "Esta invitación ya se utilizó. Inicia sesión con tu cuenta."
                  : invitation.estado === "REVOCADA"
                    ? "La administración revocó esta invitación. Solicita una nueva."
                    : "Esta invitación venció. Solicita una nueva al administrador."}
              </span>
            </div>
          )}
        </>
      ) : (
        <form
          className="token-form"
          onSubmit={(event) => {
            event.preventDefault();
            const found = readToken(input);
            setToken(found);
            startTransition(async () => setPreview(await previewAction(found)));
          }}
        >
          <span className="soft-icon">
            <Mail size={21} />
          </span>
          <h3>¿Tienes una invitación?</h3>
          <p className="small muted">
            Abre el enlace que compartió el administrador o pégalo aquí para
            continuar.
          </p>
          <Field
            label="Enlace o token de invitación"
            name="invitation"
            autoComplete="off"
            required
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pega tu invitación"
          />
          <button className="button primary" disabled={pending}>
            Comprobar invitación
          </button>
        </form>
      )}
      <div className="form-divider" style={{ margin: "22px 0 16px" }} />
      <Link
        href="/iniciar-sesion"
        className="center-link"
        style={{ display: "block" }}
      >
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
