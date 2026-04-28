import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { AuthenticatedUser } from "@/types/auth/authenticated-user.types";
import type {
  SessionErrorReason,
  SessionPayload,
  SessionReadResult,
} from "@/types/auth/session.types";

export type { SessionReadResult } from "@/types/auth/session.types";

const SESSION_COOKIE_NAME = "pm-ddvc-session"; // Nombre de la cookie para la sesión de autenticación
const SESSION_TTL_MS = 10 * 60 * 60 * 1000; // 10 horas
const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000; // 36000 segundos

export class SessionError extends Error {
  constructor(public readonly reason: SessionErrorReason) {
    super(`Session ${reason}`);
    this.name = "SessionError";
  }
}

export const AUTH_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME; // Exportar el nombre de la cookie para su uso en otras partes de la aplicación

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET es obligatorio en producción.");
  }

  return "pm-ddvc-dev-auth-session-secret";
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSessionCookieValue(payload: SessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function parseSessionCookieValue(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
  const actualSignature = Buffer.from(signature, "base64url");

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(fromBase64Url(encodedPayload)) as Partial<SessionPayload>;

    if (
      typeof parsedValue.userId !== "number" ||
      typeof parsedValue.username !== "string" ||
      typeof parsedValue.expiresAt !== "string"
    ) {
      return null;
    }

    return {
      userId: parsedValue.userId,
      username: parsedValue.username,
      expiresAt: parsedValue.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: AuthenticatedUser): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: getSessionCookieValue({
      userId: user.id,
      username: user.username,
      expiresAt: expiresAt.toISOString(),
    }),
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high",
  });
}

export async function readSession(): Promise<SessionReadResult> {
  const cookieStore = await cookies();
  const rawSessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawSessionCookie) {
    return {
      status: "missing",
    };
  }

  const parsedSession = parseSessionCookieValue(rawSessionCookie);

  if (!parsedSession) {
    return {
      status: "invalid",
    };
  }

  const expiresAt = new Date(parsedSession.expiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return {
      status: "invalid",
    };
  }

  if (expiresAt.getTime() <= Date.now()) {
    return {
      status: "expired",
    };
  }

  return {
    status: "authenticated",
    user: {
      id: parsedSession.userId,
      username: parsedSession.username,
    },
    expiresAt,
  };
}

export async function requireSession(): Promise<AuthenticatedUser> {
  const session = await readSession();

  if (session.status !== "authenticated") {
    throw new SessionError(session.status);
  }

  return session.user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getExpiredSessionRedirectPath(): string {
  return "/auth/clear-session?redirectTo=/login&reason=expired";
}

export function getInvalidSessionRedirectPath(): string {
  return "/auth/clear-session?redirectTo=/login";
}
