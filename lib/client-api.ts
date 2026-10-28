import { readApiResponse, unreachable, type ApiResult } from "@/lib/api-result";

// For Client Components. Calls this app's Route Handlers (app/api), which
// mirror the nest-ims routes and add the session from the httpOnly cookies.
export async function callApi<T>(
  path: string,
  {
    method = "POST",
    body,
  }: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<ApiResult<T>> {
  const json = body !== undefined && !(body instanceof FormData);
  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers: json ? { "content-type": "application/json" } : undefined,
      body: json ? JSON.stringify(body) : (body as FormData | undefined),
    });
    return await readApiResponse<T>(response);
  } catch {
    return unreachable;
  }
}
