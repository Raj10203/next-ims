import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ListBody, ListTransition } from "@/components/list-transition";
import { Pagination } from "@/components/pagination";
import { EmptyState, LoadError } from "@/components/states";
import { can, fullName, getCurrentUser, roleLabel } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listSites } from "@/lib/sites";
import {
  canManage,
  inviteExpiry,
  listAssignableRoles,
  listUsers,
  parseUserQuery,
  userStatus,
  type ManagedUser,
} from "@/lib/users";
import { ResendInvitationButton } from "./account-actions";
import { UserFilters } from "./user-filters";
import { UserStatusBadge } from "./user-status-badge";

export async function UserDirectory({
  path,
  searchParams,
  invitations = false,
}: {
  path: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  invitations?: boolean;
}) {
  const query = parseUserQuery(await searchParams);
  if (invitations) query.status = "invited";

  const actor = await getCurrentUser();
  if (!actor.ok) return <LoadError error={actor.error} />;

  const [users, roles, sites] = await Promise.all([
    listUsers(query),
    can(actor.data, "create", "User") ? listAssignableRoles() : null,
    can(actor.data, "read", "Site") ? listSites({ limit: "100" }) : null,
  ]);

  return (
    <ListTransition>
      <div className="space-y-4">
        <UserFilters
          action={path}
          query={query}
          roles={roles?.ok ? roles.data : null}
          sites={sites?.ok ? sites.data.items : null}
          showStatus={!invitations}
        />
        <ListBody>
          {!users.ok ? (
            <LoadError error={users.error} />
          ) : users.data.items.length === 0 ? (
            <NoUsers
              filtered={
                !!(
                  query.search ||
                  query.roleId ||
                  query.siteId ||
                  query.page
                ) ||
                (!invitations && !!query.status)
              }
              invitations={invitations}
            />
          ) : (
            <>
              <UserCards
                users={users.data.items}
                canResend={(user) => invitations && canManage(actor.data, user)}
              />
              <UserTable
                users={users.data.items}
                invitations={invitations}
                canResend={(user) => invitations && canManage(actor.data, user)}
              />
              <Pagination path={path} query={query} {...users.data} />
            </>
          )}
        </ListBody>
      </div>
    </ListTransition>
  );
}

function NoUsers({
  filtered,
  invitations,
}: {
  filtered: boolean;
  invitations: boolean;
}) {
  if (filtered) {
    return (
      <EmptyState
        title="No users match these filters"
        description="Try another search or clear the filters."
      />
    );
  }
  return invitations ? (
    <EmptyState
      title="No pending invitations"
      description="Everyone you invited has set a password."
    />
  ) : (
    <EmptyState title="No users yet" description="Users you add appear here." />
  );
}

function siteName(user: ManagedUser) {
  return user.site?.name ?? "No site";
}

function Expiry({ user }: { user: ManagedUser }) {
  const expires = inviteExpiry(user);
  if (!expires) return <span className="text-muted">Not sent</span>;
  return expires < new Date() ? (
    <span className="text-warning">Expired {formatDate(expires)}</span>
  ) : (
    <span>{formatDate(expires)}</span>
  );
}

function UserCards({
  users,
  canResend,
}: {
  users: ManagedUser[];
  canResend: (user: ManagedUser) => boolean;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface md:hidden">
      {users.map((user) => (
        <li key={user.id} className="p-4">
          <Link
            href={`/people/${user.id}`}
            className="flex min-h-11 items-center gap-3"
          >
            <Avatar name={fullName(user)} src={user.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {fullName(user)}
              </span>
              <span className="block truncate text-sm text-muted">
                {user.email}
              </span>
            </span>
            <UserStatusBadge status={userStatus(user)} />
          </Link>
          <p className="mt-2 text-sm text-muted">
            {roleLabel(user.role.name)} · {siteName(user)}
          </p>
          {canResend(user) && (
            <div className="mt-3 space-y-2">
              <p className="text-sm">
                Link expires: <Expiry user={user} />
              </p>
              <ResendInvitationButton userId={user.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function UserTable({
  users,
  invitations,
  canResend,
}: {
  users: ManagedUser[];
  invitations: boolean;
  canResend: (user: ManagedUser) => boolean;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Role
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Site
            </th>
            {invitations ? (
              <>
                <th scope="col" className="px-4 py-3 font-medium">
                  Link expires
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </>
            ) : (
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/people/${user.id}`}
                  className="flex items-center gap-3 rounded-lg"
                >
                  <Avatar name={fullName(user)} src={user.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium hover:underline">
                      {fullName(user)}
                    </span>
                    <span className="block truncate text-muted">
                      {user.email}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3">{roleLabel(user.role.name)}</td>
              <td className="px-4 py-3">{siteName(user)}</td>
              {invitations ? (
                <>
                  <td className="px-4 py-3">
                    <Expiry user={user} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canResend(user) && (
                      <ResendInvitationButton userId={user.id} />
                    )}
                  </td>
                </>
              ) : (
                <td className="px-4 py-3">
                  <UserStatusBadge status={userStatus(user)} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
