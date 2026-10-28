"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CodeInput,
  FieldError,
  FormMessage,
  SubmitLabel,
  inputClass,
  secondaryClass,
  submitClass,
} from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { formError, type FormState } from "@/lib/api-result";
import { callApi } from "@/lib/client-api";
import { safeNext, verifyEmailUrl } from "@/lib/paths";
import { field, useFormSubmit } from "@/lib/use-form-submit";

type SignedIn = { user: { emailVerifiedAt: string | null } };
type CodeRequired = { mfaRequired: true; message: string };

export function LoginFormWithNext() {
  return <LoginForm next={useSearchParams().get("next") ?? ""} />;
}

export function LoginForm({ next = "" }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({});
  const errors = state.fieldErrors ?? {};

  function signedIn({ user }: SignedIn) {
    const target = safeNext(next);
    router.replace(user.emailVerifiedAt ? target : verifyEmailUrl(target));
  }

  const { pending, onSubmit } = useFormSubmit(async (form, intent) => {
    if (intent === "restart") {
      setStep("password");
      setState({});
      return;
    }

    if (step === "code") {
      const result = await callApi<SignedIn>("/auth/login/mfa", {
        body: { otp: field(form, "otp") },
      });
      if (result.ok) return signedIn(result.data);
      // The challenge expired or was used up: start again from the password.
      if (result.error.statusCode === 401) setStep("password");
      return setState(formError(result.error, ["otp"]));
    }

    const typed = field(form, "email");
    const result = await callApi<SignedIn | CodeRequired>("/auth/login", {
      body: { email: typed, password: field(form, "password") },
    });
    if (!result.ok) {
      return setState(formError(result.error, ["email", "password"]));
    }
    if ("mfaRequired" in result.data) {
      setEmail(typed);
      setStep("code");
      return setState({ tone: "info", message: result.data.message });
    }
    signedIn(result.data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormMessage message={state.message} tone={state.tone} />

      {step === "password" ? (
        <>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              defaultValue={email}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={inputClass}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>

          <div>
            <PasswordInput
              id="password"
              label="Password"
              autoComplete="current-password"
              error={errors.password}
            />
            <Link
              href="/forgot-password"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={pending} className={submitClass}>
            <SubmitLabel
              pending={pending}
              label="Sign in"
              pendingLabel="Signing in…"
            />
          </button>
        </>
      ) : (
        <>
          <CodeInput
            hint={`The sign-in code sent to ${email}.`}
            error={errors.otp}
          />

          <button type="submit" disabled={pending} className={submitClass}>
            <SubmitLabel
              pending={pending}
              label="Verify and sign in"
              pendingLabel="Checking…"
            />
          </button>
          <button
            type="submit"
            value="restart"
            formNoValidate
            disabled={pending}
            className={secondaryClass}
          >
            Use a different account
          </button>
        </>
      )}
    </form>
  );
}
