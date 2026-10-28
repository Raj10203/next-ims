"use client";

import {
  FormMessage,
  SubmitLabel,
  TextField,
  submitClass,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import { field, optionalField } from "@/lib/use-form-submit";

const fields = ["firstName", "middleName", "lastName"];

// Email, role and site are changed by an admin (PATCH /users/:id).
export function NameForm({
  firstName,
  middleName,
  lastName,
}: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  const { state, pending, onSubmit } = useApiForm(
    (form) =>
      callApi("/auth/me", {
        method: "PATCH",
        body: {
          firstName: field(form, "firstName"),
          middleName: optionalField(form, "middleName"),
          lastName: field(form, "lastName"),
        },
      }),
    { fields, onSuccess: () => ({ tone: "success", message: "Saved." }) },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <TextField
        id="firstName"
        label="First name"
        autoComplete="given-name"
        required
        maxLength={100}
        defaultValue={firstName}
        error={errors.firstName}
      />
      <TextField
        id="middleName"
        label="Middle name (optional)"
        autoComplete="additional-name"
        maxLength={100}
        defaultValue={middleName ?? ""}
        error={errors.middleName}
      />
      <TextField
        id="lastName"
        label="Last name"
        autoComplete="family-name"
        required
        maxLength={100}
        defaultValue={lastName}
        error={errors.lastName}
      />
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel pending={pending} label="Save" pendingLabel="Saving…" />
      </button>
    </form>
  );
}
