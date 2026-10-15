"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Store, UserRound, ShieldCheck } from "lucide-react";
import { loginAction, registerAction } from "@/lib/actions";
import { Field } from "./ui";
import { Feedback, Submit } from "./form-feedback";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="form-stack">
      <Feedback state={state} />
      <Field
        label="Correo electrónico"
        name="correo"
        type="email"
        autoComplete="username"
        placeholder="tu@correo.com"
        required
        maxLength={150}
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        required
        minLength={10}
        maxLength={128}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {state.empresas && (
        <div className="field">
          <label htmlFor="empresaId">Selecciona tu tienda</label>
          <select id="empresaId" name="empresaId" required defaultValue="">
            <option value="" disabled>
              Elige con cuál continuar
            </option>
            {state.empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      <Submit pendingText="Entrando a tu tienda…">Entrar a mi tienda</Submit>
      <div className="form-divider" />
      <div className="form-bottom">
        <span>¿Vas a abrir un negocio nuevo?</span>
        <Link className="text-link" href="/registrar-tienda">
          Registrar una tienda <Store size={15} />
        </Link>
      </div>
      <p className="small muted">
        Para sumarte a una tienda existente, utiliza la invitación que
        recibiste.
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  const [values, setValues] = useState({
    nombre: "",
    correo: "",
    password: "",
    nombreEmpresa: "",
    numeroDocumento: "",
  });
  function value(name: keyof typeof values) {
    return {
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setValues((previous) => ({ ...previous, [name]: e.target.value })),
    };
  }
  return (
    <form action={action} className="form-stack">
      <Feedback state={state} />
      <h3 className="section-label">
        <UserRound size={15} /> Datos del administrador
      </h3>
      <Field
        name="nombre"
        label="Tu nombre"
        autoComplete="name"
        placeholder="Nombre y apellidos"
        required
        maxLength={150}
        {...value("nombre")}
      />
      <Field
        name="correo"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        maxLength={150}
        {...value("correo")}
      />
      <Field
        name="password"
        label="Crear contraseña"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={128}
        hint="Usa entre 10 y 128 caracteres."
        {...value("password")}
      />
      <div className="form-divider" />
      <h3 className="section-label">
        <Store size={15} /> Datos del negocio
      </h3>
      <Field
        name="nombreEmpresa"
        label="Nombre de la tienda"
        placeholder="Por ejemplo, Bodega Ana"
        required
        maxLength={200}
        {...value("nombreEmpresa")}
      />
      <Field
        name="numeroDocumento"
        label="Número de documento del negocio"
        placeholder="RUC u otro documento"
        required
        maxLength={20}
        {...value("numeroDocumento")}
      />
      <div className="callout green small">
        <ShieldCheck size={18} />
        <span>
          Crearás una tienda nueva y tendrás el rol de administrador. Para
          unirte a otra tienda, utiliza su invitación.
        </span>
      </div>
      <Submit pendingText="Creando tu tienda…">Crear tienda</Submit>
      <Link href="/iniciar-sesion" className="center-link">
        Ya tengo cuenta · Iniciar sesión
      </Link>
    </form>
  );
}
