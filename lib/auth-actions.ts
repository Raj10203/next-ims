"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, type ApiError } from "@/lib/api";
import type { ApiUser } from "@/lib/auth";
import {
  ACCESS_COOKIE,
  MFA_COOKIE,
  clearSession,
  cookieOptions,
  saveSession,
  type TokenPair,
} from "@/lib/session";

export type LoginState = {
  step: "password" | "code";
  email?: string;
  message?: string;
  tone?: "error" | "info";
  fieldErrors?: Record<string, string>;
};

type SignedIn = { user: ApiUser } & TokenPair;
type CodeRequired = {
  mfaRequired: true;
  challengeToken: string;
  expiresInMinutes: number;
  message: string;
};

function failed(
  step: LoginState["step"],
  email: string,
  error: ApiError,
): LoginState {
  const fieldErrors = Object.fromEntries(
    (error.errors ?? []).map(({ path, message }) => [path, message]),
  );
  return {
    step,
    email,
    tone: "error",
    message: error.errors?.length ? undefined : error.message,
    fieldErrors,
  };
}

// Only paths on this site, so ?next= cannot send users elsewhere. Parsing
// like a browser catches tricks a pattern misses: browsers drop tabs and
// newlines, so "/\t/evil.example" becomes "//evil.example".
function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/";
  try {
    const url = new URL(value, "http://n");
    if (url.origin === "http://n") return url.pathname + url.search + url.hash;
  } catch {}
  return "/";
}

export async function login(
  _: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const store = await cookies();
  const email = String(formData.get("email") ?? "");

  if (formData.get("intent") === "restart") {
    store.delete(MFA_COOKIE);
    return { step: "password", email };
  }

  if (formData.get("step") === "code") {
    const challengeToken = store.get(MFA_COOKIE)?.value;
    if (!challengeToken) {
      return {
        step: "password",
        email,
        tone: "error",
        message: "The sign-in code has expired. Sign in again.",
      };
    }
    const result = await apiFetch<SignedIn>("/auth/login/mfa", {
      method: "POST",
      body: { challengeToken, otp: String(formData.get("otp") ?? "") },
    });
    if (!result.ok) return failed("code", email, result.error);
    store.delete(MFA_COOKIE);
    await saveSession(result.data);
  } else {
    const result = await apiFetch<SignedIn | CodeRequired>("/auth/login", {
      method: "POST",
      body: { email, password: String(formData.get("password") ?? "") },
    });
    if (!result.ok) return failed("password", email, result.error);

    if ("mfaRequired" in result.data) {
      store.set({
        name: MFA_COOKIE,
        value: result.data.challengeToken,
        maxAge: result.data.expiresInMinutes * 60,
        ...cookieOptions,
      });
      return {
        step: "code",
        email,
        tone: "info",
        message: result.data.message,
      };
    }
    await saveSession(result.data);
  }

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  // Revokes the refresh token on the API; the cookies go either way.
  if (token) await apiFetch("/auth/logout", { method: "POST", token });
  await clearSession();
  redirect("/login");
}
