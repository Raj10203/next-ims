"use client";

import { useState } from "react";
import { FormMessage, SubmitLabel, submitClass } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { PasswordRules } from "@/components/password-rules";
import type { ApiResult } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { field } from "@/lib/use-form-submit";
import { useApiForm } from "@/lib/use-api-form";

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

// PATCH /users/:id { password }: also activates an invited user and cancels
// their invitation link.
export function PasswordForm({ userId }: { userId: number }) {
  const [password, setPassword] = useState("");

  const { state, pending, onSubmit } = useApiForm(
    async (form) => {
      if (field(form, "password") !== field(form, "confirmPassword")) {
        return mismatch;
      }
      return callApi(`/users/${userId}`, {
        method: "PATCH",
        body: { password: field(form, "password") },
      });
    },
    {
      fields: ["password", "confirmPassword"],
      onSuccess(_, form) {
        form.reset();
        setPassword("");
        return { tone: "success", message: "Password set." };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

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
          onChange={setPassword}
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
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Set password"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
