"use client";

import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { PasswordRules } from "@/components/password-rules";
import type { ApiResult } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field } from "@/lib/use-form-submit";

const mismatch: ApiResult<never> = {
  ok: false,
  error: {
    statusCode: 400,
    message: "The passwords do not match.",
    errors: [
      { path: "confirmPassword", message: "The passwords do not match." },
    ],
  },
};

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");

  const { state, pending, onSubmit } = useApiForm(
    async (form) => {
      if (field(form, "password") !== field(form, "confirmPassword")) {
        return mismatch;
      }
      return callApi<{ message: string }>("/auth/me/password", {
        method: "PUT",
        body: {
          currentPassword: field(form, "currentPassword"),
          password: field(form, "password"),
        },
      });
    },
    {
      fields: ["currentPassword", "password", "confirmPassword"],
      refresh: false,
      onSuccess(data, form) {
        form.reset();
        setPassword("");
        return { tone: "success", message: data.message };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <PasswordInput
        id="currentPassword"
        label="Current password"
        autoComplete="current-password"
        error={errors.currentPassword}
      />
      <div>
        <PasswordInput
          id="new-password"
          name="password"
          label="New password"
          autoComplete="new-password"
          hintId="new-password-rules"
          error={errors.password}
          onChange={setPassword}
        />
        <PasswordRules id="new-password-rules" password={password} />
      </div>
      <PasswordInput
        id="confirmPassword"
        label="Repeat the new password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Change password"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
