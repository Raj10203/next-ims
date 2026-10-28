import { useRouter } from "next/navigation";
import { useState } from "react";
import { formError, type ApiResult, type FormState } from "@/lib/api-result";
import { loginUrl } from "@/lib/paths";
import { useFormSubmit } from "@/lib/use-form-submit";

// A 401 goes to sign-in and back. Pass refresh: false when onSuccess
// navigates away.
export function useApiForm<T>(
  send: (form: HTMLFormElement, intent: string | null) => Promise<ApiResult<T>>,
  {
    fields = [],
    refresh = true,
    onSuccess,
  }: {
    fields?: string[];
    refresh?: boolean;
    onSuccess?: (data: T, form: HTMLFormElement) => FormState | void;
  } = {},
) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({});

  const { pending, onSubmit } = useFormSubmit(async (form, intent) => {
    const result = await send(form, intent);
    if (!result.ok) {
      if (result.error.statusCode === 401) {
        return router.replace(loginUrl(location.pathname + location.search));
      }
      return setState(formError(result.error, fields));
    }
    setState(onSuccess?.(result.data, form) ?? {});
    if (refresh) router.refresh();
  });

  return { state, setState, pending, onSubmit };
}
