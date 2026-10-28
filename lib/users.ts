import "server-only";
import type { ApiResult } from "@/lib/api-result";
import { can, userFetch, type ApiUser } from "@/lib/auth";
import {
  digits,
  oneOf,
  text,
  toSearch,
  type Page,
  type SearchParams,
} from "@/lib/query";
import { listSites, type PersonSummary, type SiteOption } from "@/lib/sites";

export type UserStatus = "invited" | "active" | "inactive";

export type RoleOption = {
  id: number;
  name: string;
  kind: "primary" | "feature";
  level: number;
};

// Related users (createdBy) are only a summary: nest-ims keeps the email and
// status behind the users read scope.
export type UserSummary = Omit<PersonSummary, "avatarUrl">;

export type ManagedUser = UserSummary & {
  email: string;
  emailVerifiedAt: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  isActive: boolean;
  activatedAt: string | null;
  invitedAt: string | null;
  createdAt: string;
  role: RoleOption;
  site: SiteOption | null;
  createdBy: UserSummary | null;
  createdById: number | null;
  // Only on GET /users/:id.
  featureRoles?: { id: number; role: { id: number; name: string } }[];
};

export type UserQuery = {
  search?: string;
  status?: UserStatus;
  roleId?: string;
  siteId?: string;
  page?: string;
  limit?: string;
};

export const statuses: UserStatus[] = ["invited", "active", "inactive"];

// INVITE_TTL_HOURS in nest-ims.
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

// Derived like the API's ?status= filter: nothing stores it.
export function userStatus(user: ManagedUser): UserStatus {
  if (!user.isActive) return "inactive";
  return user.activatedAt ? "active" : "invited";
}

export function inviteExpiry(user: ManagedUser) {
  return user.invitedAt
    ? new Date(new Date(user.invitedAt).getTime() + INVITE_TTL_MS)
    : null;
}

// The list only holds users the actor may read: lower roles (only those they
// created, below admin) plus themselves. So the actor may change anyone in it
// but themselves, unless they manage everything.
export function canManage(actor: ApiUser, target: { id: number }) {
  return (
    can(actor, "update", "User") &&
    (target.id !== actor.id || can(actor, "manage", "all"))
  );
}

// Drops what the API would refuse with a 400, such as ?page=abc.
export function parseUserQuery(params: SearchParams): UserQuery {
  return {
    search: text(params.search, 150),
    status: oneOf(params.status, statuses),
    roleId: digits(params.roleId),
    siteId: digits(params.siteId),
    page: digits(params.page),
  };
}

export function listUsers(query: UserQuery) {
  return userFetch<Page<ManagedUser>>(`/users${toSearch(query)}`);
}

export function getUser(id: string) {
  return userFetch<ManagedUser>(`/users/${id}`);
}

// Primary roles the user may give: lower than their own.
export function listAssignableRoles() {
  return userFetch<RoleOption[]>("/roles");
}

export function listFeatureRoles() {
  return userFetch<RoleOption[]>("/roles/features");
}

// Site in-charges may not list sites, so their forms offer the sites already
// known: the user's current one and the actor's own (by id only).
export async function siteOptions(
  actor: ApiUser,
  known: (SiteOption | null)[] = [],
): Promise<ApiResult<SiteOption[]>> {
  let sites = known.filter((site): site is SiteOption => !!site);
  if (can(actor, "read", "Site")) {
    const result = await listSites({ limit: "100" });
    if (!result.ok) return result;
    sites = [...result.data.items, ...sites];
  } else if (actor.siteId) {
    sites.unshift({ id: actor.siteId, name: "Your site", code: "" });
  }
  const unique = new Map(sites.map((site) => [site.id, site]));
  return { ok: true, status: 200, data: [...unique.values()] };
}
