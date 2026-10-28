"use client";

import { useState } from "react";
import {
  FieldError,
  FormMessage,
  SubmitLabel,
  inputClass,
  submitClass,
} from "@/components/form";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { field, useFormSubmit } from "@/lib/use-form-submit";

export function ForgotPasswordForm() {
  const [state, setState] = useState<FormState & { sent?: boolean }>({});
  const errors = state.fieldErrors ?? {};

  const { pending, onSubmit } = useFormSubmit(async (form) => {
    const result = await callApi<{ message: string }>("/auth/forgot-password", {
      body: { email: field(form, "email") },
    });
    setState(
      result.ok
        ? { sent: true, tone: "success", message: result.data.message }
        : formError(result.error, ["email"]),
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      {state.sent && (
        <p className="text-sm text-muted">
          The link works once and expires in an hour. Nothing arrived? Check
          your spam folder, or send it again.
        </p>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClass}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        <SubmitLabel
          pending={pending}
          label={state.sent ? "Send again" : "Email me a link"}
          pendingLabel="Sending…"
        />
      </button>
    </form>
  );
}
