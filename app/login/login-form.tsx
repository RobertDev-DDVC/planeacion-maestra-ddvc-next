"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login } from "@/app/login/actions";
import type { LoginActionState } from "@/types/login/login-action-state.types";

type LoginFormProps = {
  initialMessage?: string | null;
  testUsername: string;
  testPassword: string;
};

const initialState: LoginActionState = {
  errorMessage: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-linear-to-r from-brand-primary-dark via-brand-primary to-brand-primary-soft px-5 text-sm font-semibold tracking-[0.06em] text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
      disabled={pending}
    >
      {pending ? "Autenticando..." : "Iniciar sesión"}
    </button>
  );
}

export function LoginForm({
  initialMessage,
  testUsername,
  testPassword,
}: LoginFormProps) {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="grid gap-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-primary/70">
          Acceso local
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Inicia sesión para entrar a PM DDVC
        </h1>
        <p className="text-sm leading-6 text-foreground/74">
          La sesión dura 10 horas exactas y se guarda con cookie segura del lado
          del servidor.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-primary/12 bg-brand-primary/5 px-4 py-3 text-sm text-foreground/78">
        <p className="font-semibold text-brand-primary">Usuario de prueba temporal</p>
        <p className="mt-1">
          Usuario: <span className="font-semibold">{testUsername}</span>
        </p>
        <p>
          Contraseña: <span className="font-semibold">{testPassword}</span>
        </p>
      </div>

      {initialMessage ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {initialMessage}
        </p>
      ) : null}

      {state.errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.errorMessage}
        </p>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">Usuario</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="min-h-12 rounded-2xl border border-border-soft bg-white px-4 text-sm text-foreground outline-none transition-colors focus:border-brand-primary"
            placeholder="usuario.prueba"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">Contraseña</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-12 rounded-2xl border border-border-soft bg-white px-4 text-sm text-foreground outline-none transition-colors focus:border-brand-primary"
            placeholder="Ingresa tu contraseña"
          />
        </label>

        <SubmitButton />
      </form>
    </div>
  );
}
