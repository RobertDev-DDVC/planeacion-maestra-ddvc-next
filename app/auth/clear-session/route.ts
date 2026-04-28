import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME, clearSession } from "@/lib/session";

function getSafeRedirectPath(request: NextRequest): string {
  const redirectTo = request.nextUrl.searchParams.get("redirectTo");

  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/login";
  }

  return redirectTo;
}

export async function GET(request: NextRequest) {
  await clearSession();

  const redirectUrl = new URL(getSafeRedirectPath(request), request.url);
  const reason = request.nextUrl.searchParams.get("reason");

  if (reason) {
    redirectUrl.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
