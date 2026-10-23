import "server-only";
import { cookies } from "next/headers";
import { apiRequest } from "@/lib/api";

export const ACCESS_COOKIE = "ims_access";
export const REFRESH_COOKIE = "ims_refresh";
export const MFA_COOKIE = "ims_mfa";
// Set by proxy.ts: Server Components cannot read the URL otherwise.
export const PATH_HEADER = "x-ims-path";

export function loginUrl(path: string | null) {
  return path && path !== "/"
    ? `/login?next=${encodeURIComponent(path)}`
    : "/login";
}

export type TokenPair = { accessToken: string; refreshToken: string };

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

function secondsUntilExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Math.max(0, exp - Math.floor(Date.now() / 1000));
  } catch {
    return 0;
  }
}

// The access cookie expires 30 seconds before its token, so the proxy
// refreshes before the API starts answering 401.
export function sessionCookies({ accessToken, refreshToken }: TokenPair) {
  return [
    {
      name: ACCESS_COOKIE,
      value: accessToken,
      maxAge: Math.max(0, secondsUntilExpiry(accessToken) - 30),
      ...cookieOptions,
    },
    {
      name: REFRESH_COOKIE,
      value: refreshToken,
      maxAge: secondsUntilExpiry(refreshToken),
      ...cookieOptions,
    },
  ];
}

export async function saveSession(tokens: TokenPair) {
  const store = await cookies();
  for (const cookie of sessionCookies(tokens)) store.set(cookie);
}

export async function clearSession() {
  const store = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, MFA_COOKIE]) {
    store.delete(name);
  }
}

const refreshes = new Map<
  string,
  Promise<TokenPair | "invalid" | "unavailable">
>();

// The API rotates the refresh token on every use, so parallel requests (page
// loads, prefetches) refreshing with the same token would log the user out.
// They share one call instead, and the result is kept for a minute for
// requests that still carry the old cookie. This works within one process;
// with several app instances, keep each session on one instance.
export function refreshSession(
  refreshToken: string,
  forwardedFor: string | null,
) {
  let pending = refreshes.get(refreshToken);
  if (!pending) {
    pending = apiRequest<TokenPair>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      forwardedFor,
    }).then((result) => {
      if (result.ok) return result.data;
      return result.error.statusCode === 401 ? "invalid" : "unavailable";
    });
    refreshes.set(refreshToken, pending);
    setTimeout(() => refreshes.delete(refreshToken), 60_000);
  }
  return pending;
}
