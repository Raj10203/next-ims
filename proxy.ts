import { NextResponse, type NextRequest } from "next/server";
import { clientIp } from "@/lib/api";
import {
  ACCESS_COOKIE,
  PATH_HEADER,
  REFRESH_COOKIE,
  loginUrl,
  refreshSession,
  sessionCookies,
} from "@/lib/session";

// /set-password is linked from invitation emails (INVITE_PATH in nest-ims).
const publicPaths = ["/login", "/set-password"];

function next(request: NextRequest) {
  const headers = new Headers(request.headers);
  const { pathname, search } = request.nextUrl;
  headers.set(PATH_HEADER, pathname + search);
  return NextResponse.next({ request: { headers } });
}

// An optimistic check on cookies only: the API still authorizes every call.
export async function proxy(request: NextRequest) {
  if (request.cookies.has(ACCESS_COOKIE)) return next(request);

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const result = refreshToken
    ? await refreshSession(refreshToken, clientIp(request.headers))
    : "invalid";

  if (typeof result === "object") {
    const cookies = sessionCookies(result);
    // Also on the request, so this render already sees the new tokens.
    for (const { name, value } of cookies) request.cookies.set(name, value);
    const response = next(request);
    for (const cookie of cookies) response.cookies.set(cookie);
    return response;
  }

  // API down: keep the refresh cookie so the next request can try again.
  if (
    result === "unavailable" ||
    publicPaths.includes(request.nextUrl.pathname)
  ) {
    const response = next(request);
    if (refreshToken && result === "invalid")
      response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const { pathname, search } = request.nextUrl;
  const response = NextResponse.redirect(
    new URL(loginUrl(pathname + search), request.url),
  );
  if (refreshToken) response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
