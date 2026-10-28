import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { FormSkeleton } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { listAssignableRoles, siteOptions } from "@/lib/users";
import { BackLink } from "@/components/back-link";
import { roleOptions, siteLabels } from "../_components/options";
import { UserForm } from "../_components/user-form";

export const metadata: Metadata = { title: "Add user" };

async function NewUserForm() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <FormMessage message={actor.error.message} />;
  if (!can(actor.data, "create", "User")) {
    return <FormMessage message="Your role cannot add users." />;
  }

  const [roles, sites] = await Promise.all([
    listAssignableRoles(),
    siteOptions(actor.data),
  ]);
  if (!roles.ok) return <FormMessage message={roles.error.message} />;
  if (!sites.ok) return <FormMessage message={sites.error.message} />;
  return (
    <UserForm
      roles={roleOptions(roles.data)}
      sites={siteLabels(sites.data)}
      defaultSiteId={actor.data.siteId}
    />
  );
}

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/people" label="Users" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Add user
        </h1>
        <p className="mt-1 text-muted">
          They get an email with a link to set their password.
        </p>
      </div>
      <section className="max-w-3xl rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Suspense fallback={<FormSkeleton />}>
          <NewUserForm />
        </Suspense>
      </section>
    </div>
  );
}
