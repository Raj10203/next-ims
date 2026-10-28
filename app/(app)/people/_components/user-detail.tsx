import { Avatar } from "@/components/avatar";
import { AvatarForm } from "@/components/avatar-form";
import { FormMessage } from "@/components/form";
import { DetailList, Section } from "@/components/section";
import { LoadError, NotFoundState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { can, fullName, getCurrentUser, roleLabel } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  canManage,
  getUser,
  inviteExpiry,
  listAssignableRoles,
  listFeatureRoles,
  siteOptions,
  userStatus,
  type ManagedUser,
} from "@/lib/users";
import { AccountActions } from "./account-actions";
import { PasswordForm } from "./password-form";
import { roleOptions, siteLabels } from "./options";
import { FeatureRolesForm, RoleForm } from "./role-forms";
import { UserForm } from "./user-form";
import { UserStatusBadge } from "./user-status-badge";

function NotFound() {
  return (
    <NotFoundState
      title="User not found"
      href="/people"
      label="Back to users"
    />
  );
}

function Details({ user }: { user: ManagedUser }) {
  const status = userStatus(user);
  const expires = inviteExpiry(user);
  const rows: [string, React.ReactNode][] = [
    ["Role", roleLabel(user.role.name)],
    [
      "Feature roles",
      user.featureRoles?.length
        ? user.featureRoles
            .map((grant) => roleLabel(grant.role.name))
            .join(", ")
        : "None",
    ],
    ["Site", user.site?.name ?? "No site"],
    [
      "Email",
      user.emailVerifiedAt ? (
        <StatusBadge tone="success">Verified</StatusBadge>
      ) : (
        <StatusBadge tone="warning">Not verified</StatusBadge>
      ),
    ],
    ["Sign-in code", user.mfaEnabled ? "On" : "Off"],
    [
      "Added",
      user.createdBy
        ? `${formatDate(user.createdAt)} by ${fullName(user.createdBy)}`
        : formatDate(user.createdAt),
    ],
    user.activatedAt
      ? ["First sign-in", formatDate(user.activatedAt)]
      : [
          "Invitation",
          status === "invited" && expires
            ? `${expires < new Date() ? "Expired" : "Expires"} ${formatDate(expires)}`
            : "No valid link",
        ],
  ];

  return <DetailList rows={rows} />;
}

// Your own role, password and account are left out, so nobody locks
// themselves out.
export async function UserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <NotFound />;

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;
  const result = await getUser(id);
  if (!result.ok) {
    return result.error.statusCode === 404 ? (
      <NotFound />
    ) : (
      <LoadError error={result.error} />
    );
  }

  const user = result.data;
  const name = fullName(user);
  const self = user.id === actor.data.id;
  const manage = canManage(actor.data, user);
  const manageAccount = manage && !self;
  const [roles, featureRoles, sites] = await Promise.all([
    manageAccount ? listAssignableRoles() : null,
    manageAccount && can(actor.data, "assign", "FeatureRole")
      ? listFeatureRoles()
      : null,
    manage ? siteOptions(actor.data, [user.site]) : null,
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={name} src={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {name}
          </h1>
          <p className="truncate text-muted">{user.email}</p>
        </div>
        <UserStatusBadge status={userStatus(user)} />
      </header>

      <Section id="overview" title="Overview">
        <Details user={user} />
      </Section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {manage && sites && (
          <Section id="details" title="Details">
            {sites.ok ? (
              <UserForm
                user={{
                  id: user.id,
                  firstName: user.firstName,
                  middleName: user.middleName,
                  lastName: user.lastName,
                  email: user.email,
                  siteId: user.site?.id ?? null,
                }}
                sites={siteLabels(sites.data)}
              />
            ) : (
              <FormMessage message={sites.error.message} />
            )}
          </Section>
        )}

        {(manage || self) && (
          <Section id="photo" title="Photo">
            <AvatarForm
              userId={user.id}
              name={name}
              avatarUrl={user.avatarUrl}
            />
          </Section>
        )}

        {roles && (
          <Section
            id="role"
            title="Role"
            description="Sets what they can do. Feature roles stay as they are."
          >
            {roles.ok ? (
              <RoleForm
                userId={user.id}
                roleId={user.role.id}
                roles={roleOptions(roles.data)}
              />
            ) : (
              <FormMessage message={roles.error.message} />
            )}
          </Section>
        )}

        {featureRoles && (
          <Section
            id="feature-roles"
            title="Feature roles"
            description="Extra capabilities on top of the role, whatever their site."
          >
            {featureRoles.ok ? (
              <FeatureRolesForm
                userId={user.id}
                roles={roleOptions(featureRoles.data)}
                held={(user.featureRoles ?? []).map((grant) => grant.role.id)}
              />
            ) : (
              <FormMessage message={featureRoles.error.message} />
            )}
          </Section>
        )}

        {manageAccount && (
          <Section
            id="password"
            title="Set a password"
            description="For someone who cannot use the email link. An invited user becomes active and their link stops working."
          >
            <PasswordForm userId={user.id} />
          </Section>
        )}

        {manageAccount && (
          <Section id="account" title="Account">
            <AccountActions
              userId={user.id}
              name={name}
              isActive={user.isActive}
              activated={!!user.activatedAt}
              canDelete={can(actor.data, "delete", "User")}
            />
          </Section>
        )}
      </div>
    </div>
  );
}
