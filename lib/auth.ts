import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiFetch, type ApiResult } from "@/lib/api";
import { humanize } from "@/lib/format";
import { loginUrl, verifyEmailUrl } from "@/lib/paths";
import { ACCESS_COOKIE, PATH_HEADER } from "@/lib/session";

export type ApiUser = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  emailVerifiedAt: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  role: RoleWithPermissions;
  featureRoles: { role: RoleWithPermissions }[];
  siteId: number | null;
};

type RoleWithPermissions = {
  id: number;
  name: string;
  level: number;
  permissions: { action: string; subject: string }[];
};

// Calls the API as the signed-in user. Redirects to sign-in, back to this page
// afterwards, when the session is gone; any other error is returned so the
// caller can show it.
export async function userFetch<T>(path: string): Promise<ApiResult<T>> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const result = token ? await apiFetch<T>(path, { token }) : undefined;
  if (!result || (!result.ok && result.error.statusCode === 401)) {
    redirect(loginUrl((await headers()).get(PATH_HEADER)));
  }
  return result;
}

// Only /verify-email uses this directly; every other page goes through
// getCurrentUser.
export const getSignedInUser = cache(() => userFetch<ApiUser>("/auth/me"));

// The API answers 403 to almost every call while the email is unverified
// (changed by an admin, for instance), so the app shell sends the user to
// verify it first.
export const getCurrentUser = cache(async (): Promise<ApiResult<ApiUser>> => {
  const result = await getSignedInUser();
  if (result.ok && !result.data.emailVerifiedAt) {
    redirect(verifyEmailUrl((await headers()).get(PATH_HEADER)));
  }
  return result;
});

export function fullName(
  user: Pick<ApiUser, "firstName" | "middleName" | "lastName">,
) {
  return [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");
}

export const roleLabel = humanize;

// Only to hide what the user may not do; the API decides. Same rules as CASL
// in nest-ims: "manage" is any action, "all" any subject.
export function can(user: ApiUser, action: string, subject: string) {
  return [user.role, ...user.featureRoles.map((grant) => grant.role)].some(
    (role) =>
      role.permissions.some(
        (permission) =>
          (permission.action === "manage" || permission.action === action) &&
          (permission.subject === "all" || permission.subject === subject),
      ),
  );
}
