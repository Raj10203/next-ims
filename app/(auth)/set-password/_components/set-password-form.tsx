"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { PasswordRules } from "@/components/password-rules";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { field, useFormSubmit } from "@/lib/use-form-submit";

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
        <PasswordRules id="password-rules" password={password} />
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
