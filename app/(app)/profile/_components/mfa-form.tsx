"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { StatusBadge } from "@/components/status-badge";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { loginUrl } from "@/lib/paths";
import { field, useFormSubmit } from "@/lib/use-form-submit";

export function MfaForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({});

  const { pending, onSubmit } = useFormSubmit(async (form) => {
    const result = await callApi<{ message: string }>("/auth/me/mfa", {
      method: "PUT",
      body: { enabled: !enabled, password: field(form, "password") },
    });
    if (!result.ok) {
      if (result.error.statusCode === 401)
        return router.replace(loginUrl("/profile"));
      return setState(formError(result.error, ["password"]));
    }
    form.reset();
    setState({ tone: "success", message: result.data.message });
    // Reloads the status from the API.
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      <p className="flex items-center gap-2 text-sm">
        Status:
        <StatusBadge tone={enabled ? "success" : "neutral"}>
          {enabled ? "On" : "Off"}
        </StatusBadge>
      </p>

      <PasswordInput
        id="mfa-password"
        name="password"
        label="Confirm with your password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label={enabled ? "Turn off" : "Turn on"}
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
