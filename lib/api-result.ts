// Shared by server code (lib/api.ts) and the browser (lib/client-api.ts).

export type ApiError = {
  statusCode: number;
  error?: string;
  message: string;
  errors?: { path: string; message: string }[];
};

export type ApiResult<T> =
  { ok: true; status: number; data: T } | { ok: false; error: ApiError };

export type FormState = {
  message?: string;
  tone?: "error" | "info" | "success";
  fieldErrors?: Record<string, string>;
};

export const unreachable: ApiResult<never> = {
  ok: false,
  error: {
    statusCode: 0,
    message: "Cannot reach the server. Check your connection and try again.",
  },
};

export async function readApiResponse<T>(
  response: Response,
): Promise<ApiResult<T>> {
  const data =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (response.ok) return { ok: true, status: response.status, data };
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

// The first error of each of the form's fields goes next to it; anything else
// (a token in a hidden input, or no field at all) becomes the form's message.
export function formError(error: ApiError, fields: string[]): FormState {
  const fieldErrors: Record<string, string> = {};
  let message = error.errors?.length ? undefined : error.message;
  for (const { path, message: text } of error.errors ?? []) {
    if (fields.includes(path)) fieldErrors[path] ??= text;
    else message ??= text;
  }
  return { tone: "error", message, fieldErrors };
}
