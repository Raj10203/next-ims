"use client";

import {
  FormMessage,
  SelectField,
  SubmitLabel,
  submitClass,
  type Option,
} from "@/components/form";
import { callApi } from "@/lib/client-api";
import { field } from "@/lib/use-form-submit";
import { useApiForm } from "@/lib/use-api-form";

export function RoleForm({
  userId,
  roleId,
  roles,
}: {
  userId: number;
  roleId: number;
  roles: Option[];
}) {
  const { state, pending, onSubmit } = useApiForm(
    (form) =>
      callApi(`/users/${userId}/role`, {
        method: "PUT",
        body: { roleId: Number(field(form, "roleId")) },
      }),
    {
      fields: ["roleId"],
      onSuccess: () => ({ tone: "success", message: "Role changed." }),
    },
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <SelectField
        id="roleId"
        label="Role"
        hint="Only roles below your own."
        defaultValue={roleId}
        error={state.fieldErrors?.roleId}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </SelectField>
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Change role"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}

// Sends the whole set: an empty list revokes every feature role.
export function FeatureRolesForm({
  userId,
  roles,
  held,
}: {
  userId: number;
  roles: Option[];
  held: number[];
}) {
  const { state, pending, onSubmit } = useApiForm(
    (form) =>
      callApi(`/users/${userId}/feature-roles`, {
        method: "PUT",
        body: { roleIds: new FormData(form).getAll("roleIds").map(Number) },
      }),
    { onSuccess: () => ({ tone: "success", message: "Saved." }) },
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />
      <fieldset>
        <legend className="sr-only">Feature roles</legend>
        {roles.map((role) => (
          <label
            key={role.id}
            className="flex min-h-11 items-center gap-3 text-sm font-medium"
          >
            <input
              type="checkbox"
              name="roleIds"
              value={role.id}
              defaultChecked={held.includes(role.id)}
              className="size-5 accent-primary"
            />
            {role.label}
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label="Save feature roles"
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
