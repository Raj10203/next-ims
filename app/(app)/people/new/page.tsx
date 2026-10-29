import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { FormSkeleton } from "@/components/states";
import { can, getCurrentUser } from "@/lib/auth";
import { listAssignableRoles, siteChoice } from "@/lib/users";
import { PageLayout } from "@/components/page-layout";
import { roleOptions } from "../_components/options";
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
    siteChoice(actor.data),
  ]);
  if (!roles.ok) return <FormMessage message={roles.error.message} />;
  return <UserForm roles={roleOptions(roles.data)} sites={sites} />;
}

export default function NewUserPage() {
  return (
    <PageLayout
      back={{ href: "/people", label: "Users" }}
      title="Add user"
      description="They get an email with a link to set their password."
      form
    >
      <Suspense fallback={<FormSkeleton />}>
        <NewUserForm />
      </Suspense>
    </PageLayout>
  );
}
