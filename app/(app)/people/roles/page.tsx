import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { outlineClass } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { EmptyState, ListSkeleton, LoadError } from "@/components/states";
import { can, getCurrentUser, roleLabel } from "@/lib/auth";
import {
  listAssignableRoles,
  listFeatureRoles,
  type RoleOption,
} from "@/lib/users";

export const metadata: Metadata = { title: "Roles" };

// The API lists roles but not what they allow, so this summarizes
// ROLE_PERMISSIONS and FEATURE_ROLE_PERMISSIONS (nest-ims role-permissions.ts).
// Keep it in step; a role missing here just shows without a summary.
const summaries: Record<string, string> = {
  super_admin: "Everything, including creating admins.",
  admin:
    "All users below admin, sites, the catalog, feature roles, stock and stock requests (read) and the audit log.",
  manager:
    "Users they created, sites, the catalog, feature roles and stock (read); gives the final approval of stock requests.",
  site_incharge:
    "Users they created; reads the catalog; raises stock requests for their site.",
  site_technician: "Reads their own account and the catalog.",
  stock_manager: "Adds, edits and deletes stock items, whatever the role.",
  stock_request_reviewer:
    "Reviews every site's stock requests at HQ, before a manager approves them.",
};

function RoleList({
  roles,
  usersLink,
}: {
  roles: RoleOption[];
  usersLink: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {roles.map((role) => (
        <li
          key={role.id}
          className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {roleLabel(role.name)}
              {role.kind === "primary" && (
                <span className="ml-2 text-sm font-normal text-muted">
                  Level {role.level}
                </span>
              )}
            </p>
            {summaries[role.name] && (
              <p className="mt-0.5 text-sm text-muted">
                {summaries[role.name]}
              </p>
            )}
          </div>
          {usersLink && (
            <Link href={`/people?roleId=${role.id}`} className={outlineClass}>
              Users
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

async function Roles() {
  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const [roles, features] = await Promise.all([
    listAssignableRoles(),
    can(actor.data, "assign", "FeatureRole") ? listFeatureRoles() : null,
  ]);
  if (!roles.ok) return <LoadError error={roles.error} />;

  return (
    <div className="space-y-6">
      <Section
        id="primary"
        title="Roles"
        description="Every user has one. You can give the roles below your own; a higher level manages lower ones."
      >
        {roles.data.length ? (
          <RoleList roles={roles.data} usersLink />
        ) : (
          <EmptyState title="No roles you can give" />
        )}
      </Section>
      {features && (
        <Section
          id="features"
          title="Feature roles"
          description="Extra capabilities on top of the role. Give them on a user's page."
        >
          {!features.ok ? (
            <LoadError error={features.error} />
          ) : features.data.length ? (
            <RoleList roles={features.data} usersLink={false} />
          ) : (
            <EmptyState title="No feature roles yet" />
          )}
        </Section>
      )}
    </div>
  );
}

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Roles" />
      <Suspense fallback={<ListSkeleton filters={false} />}>
        <Roles />
      </Suspense>
    </div>
  );
}
