import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiFetch } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

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

// Redirects to sign-in when the session is gone; null when the API cannot
// answer right now, so the caller can show an error instead.
export const getCurrentUser = cache(async (): Promise<ApiUser | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");

  const result = await apiFetch<ApiUser>("/auth/me", { token });
  if (result.ok) return result.data;
  if (result.error.statusCode === 401) redirect("/login");
  return null;
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
