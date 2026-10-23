import { NextResponse, type NextRequest } from "next/server";
import { clientIp } from "@/lib/api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  refreshSession,
  sessionCookies,
} from "@/lib/session";

// /set-password is linked from invitation emails (INVITE_PATH in nest-ims).
const publicPaths = ["/login", "/set-password"];

// An optimistic check on cookies only: the API still authorizes every call.
export async function proxy(request: NextRequest) {
  if (request.cookies.has(ACCESS_COOKIE)) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const result = refreshToken
    ? await refreshSession(refreshToken, clientIp(request.headers))
    : "invalid";

  if (typeof result === "object") {
    const cookies = sessionCookies(result);
    // Also on the request, so this render already sees the new tokens.
    for (const { name, value } of cookies) request.cookies.set(name, value);
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    for (const cookie of cookies) response.cookies.set(cookie);
    return response;
  }

  // API down: keep the refresh cookie so the next request can try again.
  if (
    result === "unavailable" ||
    publicPaths.includes(request.nextUrl.pathname)
  ) {
    const response = NextResponse.next();
    if (refreshToken && result === "invalid")
      response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const login = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  const response = NextResponse.redirect(login);
  if (refreshToken) response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
