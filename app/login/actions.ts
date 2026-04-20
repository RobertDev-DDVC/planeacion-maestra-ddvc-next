"use server";

import { redirect } from "next/navigation";

import {
  authenticateLocalCredential,
  ensureTestCredential,
  isSqliteNativeBindingError,
} from "@/lib/credentials";
import { createSession, readSession, clearSession } from "@/lib/session";
import type { LoginActionState } from "@/types/login/login-action-state.types";

export async function login(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const session = await readSession();

  if (session.status === "authenticated") {
    redirect("/");
  }

  if (session.status === "expired" || session.status === "invalid") {
    await clearSession();
  }

  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || typeof password !== "string") {
    return {
      errorMessage: "Ingresa usuario y contraseña.",
    };
  }

  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password) {
    return {
      errorMessage: "Ingresa usuario y contraseña.",
    };
  }

  try {
    await ensureTestCredential();

    const authenticatedUser = await authenticateLocalCredential(normalizedUsername, password);

    if (!authenticatedUser) {
      return {
        errorMessage: "Usuario o contraseña inválidos.",
      };
    }

    await createSession(authenticatedUser);
    redirect("/");
  } catch (error) {
    if (isSqliteNativeBindingError(error)) {
      return {
        errorMessage:
          "No se pudo abrir SQLite local. Habilita scripts con `ignore-scripts=false` y ejecuta `pnpm rebuild better-sqlite3`.",
      };
    }

    throw error;
  }
}
