import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { TEST_CREDENTIAL } from "@/lib/auth-types";
import {
  getExpiredSessionRedirectPath,
  getInvalidSessionRedirectPath,
  readSession,
} from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await readSession();

  if (session.status === "authenticated") {
    redirect("/");
  }

  if (session.status === "expired") {
    redirect(getExpiredSessionRedirectPath());
  }

  if (session.status === "invalid") {
    redirect(getInvalidSessionRedirectPath());
  }

  const resolvedSearchParams = await searchParams;
  const reason = getSingleSearchParam(resolvedSearchParams.reason);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-[34px] border border-white/70 bg-white/88 p-4 panel-shadow backdrop-blur sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
        <section className="rounded-[28px] bg-linear-to-br from-brand-primary-dark via-brand-primary to-brand-primary-soft px-7 py-8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/72">
              PM DDVC
            </p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Planeación maestra con acceso local
            </h2>
            <p className="max-w-md text-sm leading-7 text-white/80">
              El acceso inicial queda desacoplado de la pantalla principal para
              que las siguientes acciones ya cuenten con el usuario autenticado y
              su identificador disponible del lado del servidor.
            </p>
            <div className="grid gap-3 pt-4 text-sm text-white/80">
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3">
                Sesión fija de 10 horas
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3">
                Cookie `HttpOnly` firmada
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3">
                Usuario e id listos para futuras acciones
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border-soft/90 bg-white px-5 py-6 sm:px-6">
          <LoginForm
            initialMessage={
              reason === "expired"
                ? "Tu sesión venció. Ingresa tus credenciales de nuevo."
                : null
            }
            testUsername={TEST_CREDENTIAL.username}
            testPassword={TEST_CREDENTIAL.password}
          />
        </section>
      </div>
    </main>
  );
}
