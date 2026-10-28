import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiFetch, type ApiResult } from "@/lib/api";
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
  role: { id: number; name: string };
  siteId: number | null;
};

// Redirects to sign-in, back to this page afterwards, when the session is gone;
// any other error is returned so the caller can show it. Only /verify-email
// uses this directly; every other page goes through getCurrentUser.
export const getSignedInUser = cache(async (): Promise<ApiResult<ApiUser>> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const result = token
    ? await apiFetch<ApiUser>("/auth/me", { token })
    : undefined;
  if (!result || (!result.ok && result.error.statusCode === 401)) {
    redirect(loginUrl((await headers()).get(PATH_HEADER)));
  }
  return result;
});

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

export function fullName(user: ApiUser) {
  return [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");
}

export function roleLabel(name: string) {
  const words = name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
