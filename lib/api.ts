import "server-only";
import { headers } from "next/headers";
import { readApiResponse, unreachable, type ApiResult } from "@/lib/api-result";

export type { ApiError, ApiResult } from "@/lib/api-result";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  language?: string | null;
  // nest-ims rate-limits by client IP; without this every user would share
  // this server's IP (needs TRUST_PROXY on the API to be honoured).
  forwardedFor?: string | null;
};

const apiUrl = process.env.API_URL ?? "http://localhost:3001/api";
export const trustedProxies = Number(process.env.TRUST_PROXY) || 0;

// Next.js only fills X-Forwarded-For when the request has none, so without a
// trusted proxy in front the header is whatever the client wrote. With N
// proxies, the client is the entry the outermost one appended (N from the
// right); anything left of it is client-supplied.
export function clientIp(incoming: Pick<Headers, "get">) {
  if (trustedProxies < 1) return null;
  const hops =
    incoming
      .get("x-forwarded-for")
      ?.split(",")
      .map((hop) => hop.trim()) ?? [];
  return hops.at(-trustedProxies) || null;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token, language, forwardedFor }: RequestOptions = {},
): Promise<ApiResult<T>> {
  const requestHeaders = new Headers();
  // fetch sets the multipart content type, with its boundary, for FormData.
  const json = body !== undefined && !(body instanceof FormData);
  if (json) requestHeaders.set("content-type", "application/json");
  if (token) requestHeaders.set("authorization", `Bearer ${token}`);
  if (language) requestHeaders.set("accept-language", language);
  if (forwardedFor) requestHeaders.set("x-forwarded-for", forwardedFor);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: json ? JSON.stringify(body) : (body as FormData | undefined),
    });
    return await readApiResponse<T>(response);
  } catch {
    return unreachable;
  }
}

// For Server Components: passes on the user's language
// and IP from the incoming request.
export async function apiFetch<T>(
  path: string,
  options: Omit<RequestOptions, "language" | "forwardedFor"> = {},
) {
  const incoming = await headers();
  return apiRequest<T>(path, {
    ...options,
    language: incoming.get("accept-language"),
    forwardedFor: clientIp(incoming),
  });
}
