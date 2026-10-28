"use client";

import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { field, useFormSubmit } from "@/lib/use-form-submit";

// Mirrors passwordSchema in nest-ims as a guide while typing; the API decides,
// and also refuses a password containing the user's name.
const rules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "A capital letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "A small letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "A digit", test: (v: string) => /\d/.test(v) },
  { label: "A symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function SetPasswordFormWithToken() {
  return <SetPasswordForm token={useSearchParams().get("token") ?? ""} />;
}

// token is null until the URL has been read.
export function SetPasswordForm({ token }: { token: string | null }) {
  const [state, setState] = useState<FormState & { done?: boolean }>({});
  const [password, setPasswordValue] = useState("");
  const errors = state.fieldErrors ?? {};

  const { pending, onSubmit } = useFormSubmit(async (form) => {
    if (field(form, "password") !== field(form, "confirmPassword")) {
      return setState({
        tone: "error",
        fieldErrors: { confirmPassword: "The passwords do not match." },
      });
    }
    const result = await callApi<{ message: string }>("/invitations/accept", {
      body: { token, password: field(form, "password") },
    });
    setState(
      result.ok
        ? { done: true, tone: "success", message: result.data.message }
        : formError(result.error, ["password"]),
    );
  });

  if (state.done) {
    return (
      <div className="space-y-5">
        <FormMessage message={state.message} tone="success" />
        <Link href="/login" className={submitClass}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      <div>
        <PasswordInput
          id="password"
          label="New password"
          autoComplete="new-password"
          hintId="password-rules"
          error={errors.password}
          onChange={setPasswordValue}
        />
        <ul id="password-rules" className="mt-2 space-y-1 text-sm">
          {rules.map(({ label, test }) => {
            const met = test(password);
            const Icon = met ? Check : Circle;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 ${met ? "text-success" : "text-muted"}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {label}
                <span className="sr-only">{met ? "(done)" : "(missing)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <PasswordInput
        id="confirmPassword"
        label="Repeat the password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        disabled={pending || !token}
        className={submitClass}
      >
        <SubmitLabel
          pending={pending}
          label="Set password"
          pendingLabel="Saving…"
        />
      </button>
      {token === "" && (
        <p role="alert" className="text-sm text-danger">
          This link has no token. Open the link from your email again.
        </p>
      )}
    </form>
  );
}
