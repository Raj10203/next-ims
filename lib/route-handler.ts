import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest, clientIp, trustedProxies } from "@/lib/api";
import type { ApiResult } from "@/lib/api-result";
import { ACCESS_COOKIE, saveSession, type TokenPair } from "@/lib/session";

// The Route Handlers in app/api mirror nest-ims routes one to one: same path,
// JSON body, status codes and error shape. They only add the session: tokens
// live in httpOnly cookies and never appear in a request or response body.

type Method = "POST" | "PUT";

export function errorResponse(
  statusCode: number,
  error: string,
  message: string,
) {
  return NextResponse.json(
    { statusCode, error, message },
    { status: statusCode },
  );
}

// Server Actions refuse cross-site calls on their own; Route Handlers do not,
// and these act with the user's cookies. JSON-only bodies also keep plain
// HTML forms on other sites out.
export async function readRequest(
  request: NextRequest,
): Promise<{ body?: unknown } | NextResponse> {
  const origin = request.headers.get("origin");
  const host =
    (trustedProxies > 0 && request.headers.get("x-forwarded-host")) ||
    request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && new URL(origin).host === host;
  } catch {}
  if (!sameOrigin) {
    return errorResponse(403, "Forbidden", "Cross-site request refused.");
  }

  const text = await request.text();
  if (!text) return {};
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return errorResponse(
      415,
      "Unsupported Media Type",
      "Send the body as JSON.",
    );
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return errorResponse(400, "Bad Request", "The body is not valid JSON.");
  }
}

export function forward<T>(
  request: NextRequest,
  path: string,
  { method = "POST", body }: { method?: Method; body?: unknown } = {},
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, {
    method,
    body,
    token: request.cookies.get(ACCESS_COOKIE)?.value,
    language: request.headers.get("accept-language"),
    forwardedFor: clientIp(request.headers),
  });
}

export function toResponse<T>(result: ApiResult<T>) {
  if (!result.ok) {
    return result.error.statusCode
      ? NextResponse.json(result.error, { status: result.error.statusCode })
      : errorResponse(502, "Bad Gateway", result.error.message);
  }
  return result.status === 204
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json(result.data, { status: result.status });
}

// The whole handler for a route that needs nothing beyond the session.
// onSuccess may set cookies, or replace the response (to drop a token).
export function passThrough<T>(
  path: string,
  {
    method = "POST",
    onSuccess,
  }: {
    method?: Method;
    onSuccess?: (data: T) => Promise<NextResponse | void>;
  } = {},
) {
  return async (request: NextRequest) => {
    const read = await readRequest(request);
    if (read instanceof NextResponse) return read;
    const result = await forward<T>(request, path, { method, body: read.body });
    if (result.ok && onSuccess) {
      const replaced = await onSuccess(result.data);
      if (replaced) return replaced;
    }
    return toResponse(result);
  };
}

// Login and the MFA step: the tokens become cookies, the user is the body.
export async function signedIn<U>({
  user,
  ...tokens
}: { user: U } & TokenPair) {
  await saveSession(tokens);
  return NextResponse.json({ user });
}
