"use client";

import { useRouter } from "next/navigation";
import {
  FormMessage,
  SelectField,
  SubmitLabel,
  TextField,
  submitClass,
  type Option,
} from "@/components/form";
import { SearchSelect } from "@/components/search-select";
import { callApi } from "@/lib/client-api";
import { field } from "@/lib/use-form-submit";
import { useApiForm } from "@/lib/use-api-form";
import type { ManagedUser, SiteChoice } from "@/lib/users";

const fields = [
  "firstName",
  "middleName",
  "lastName",
  "email",
  "roleId",
  "siteId",
];

type EditedUser = Pick<
  ManagedUser,
  "id" | "firstName" | "middleName" | "lastName" | "email"
>;

// Editing leaves the role out: PATCH /users/:id cannot change it (RoleForm).
export function UserForm({
  user,
  roles,
  sites,
}: {
  user?: EditedUser;
  roles?: Option[];
  sites: SiteChoice;
}) {
  const router = useRouter();

  const { state, pending, onSubmit } = useApiForm(
    (form) => {
      const body = {
        firstName: field(form, "firstName"),
        middleName: field(form, "middleName") || null,
        lastName: field(form, "lastName"),
        email: field(form, "email"),
        siteId: Number(field(form, "siteId")),
      };
      return user
        ? callApi<ManagedUser>(`/users/${user.id}`, { method: "PATCH", body })
        : callApi<ManagedUser>("/users", {
            body: { ...body, roleId: Number(field(form, "roleId")) },
          });
    },
    {
      fields,
      refresh: !!user,
      onSuccess(saved) {
        if (!user) return router.push(`/people/${saved.id}`);
        return {
          tone: "success",
          message:
            saved.email === user.email
              ? "Saved."
              : "Saved. They must verify the new email address before they can use the app again.",
        };
      },
    },
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="First name"
          autoComplete="off"
          required
          maxLength={100}
          defaultValue={user?.firstName}
          error={errors.firstName}
        />
        <TextField
          id="middleName"
          label="Middle name (optional)"
          autoComplete="off"
          maxLength={100}
          defaultValue={user?.middleName ?? ""}
          error={errors.middleName}
        />
        <TextField
          id="lastName"
          label="Last name"
          autoComplete="off"
          required
          maxLength={100}
          defaultValue={user?.lastName}
          error={errors.lastName}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="off"
          required
          maxLength={255}
          defaultValue={user?.email}
          hint={
            user
              ? "A new address must be verified again."
              : "The invitation goes here."
          }
          error={errors.email}
        />
        {roles && (
          <SelectField
            id="roleId"
            label="Role"
            required
            defaultValue=""
            error={errors.roleId}
          >
            <option value="" disabled>
              Choose a role
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </SelectField>
        )}
        {sites.search ? (
          <SearchSelect
            id="siteId"
            label="Site"
            required
            kind="site"
            value={sites.current}
            placeholder="Choose a site"
            error={errors.siteId}
          />
        ) : (
          <SelectField
            id="siteId"
            label="Site"
            required
            defaultValue={sites.current ?? ""}
            error={errors.siteId}
          >
            <option value="" disabled>
              Choose a site
            </option>
            {sites.options.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${submitClass} sm:w-auto`}
      >
        <SubmitLabel
          pending={pending}
          label={user ? "Save changes" : "Add and send invitation"}
          pendingLabel="Saving…"
        />
      </button>
    </form>
  );
}
