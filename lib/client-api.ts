import { readApiResponse, unreachable, type ApiResult } from "@/lib/api-result";

// For Client Components. Calls this app's Route Handlers (app/api), which
// mirror the nest-ims routes and add the session from the httpOnly cookies.
export async function callApi<T>(
  path: string,
  { method = "POST", body }: { method?: "POST" | "PUT"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return await readApiResponse<T>(response);
  } catch {
    return unreachable;
  }
}
