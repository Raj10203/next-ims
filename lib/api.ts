import "server-only";
import { headers } from "next/headers";

export type ApiError = {
  statusCode: number;
  error?: string;
  message: string;
  errors?: { path: string; message: string }[];
};

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; error: ApiError };

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

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token, language, forwardedFor }: RequestOptions = {},
): Promise<ApiResult<T>> {
  const requestHeaders = new Headers();
  if (body !== undefined)
    requestHeaders.set("content-type", "application/json");
  if (token) requestHeaders.set("authorization", `Bearer ${token}`);
  if (language) requestHeaders.set("accept-language", language);
  if (forwardedFor) requestHeaders.set("x-forwarded-for", forwardedFor);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      error: {
        statusCode: 0,
        message:
          "Cannot reach the server. Check your connection and try again.",
      },
    };
  }

  const data =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (response.ok) return { ok: true, data: data as T };
  return {
    ok: false,
    error:
      typeof data?.message === "string"
        ? (data as ApiError)
        : {
            statusCode: response.status,
            message: "Something went wrong. Try again.",
          },
  };
}

// For Server Components and Server Functions: passes on the user's language
// and IP from the incoming request.
export async function apiFetch<T>(
  path: string,
  options: Omit<RequestOptions, "language" | "forwardedFor"> = {},
) {
  const incoming = await headers();
  return apiRequest<T>(path, {
    ...options,
    language: incoming.get("accept-language"),
    forwardedFor: incoming.get("x-forwarded-for"),
  });
}
