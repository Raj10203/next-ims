"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";

const initialState: LoginState = { step: "password" };

const input =
  "mt-1.5 block min-h-11 w-full rounded-lg border border-input bg-surface px-3 aria-invalid:border-danger";

const submit =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export function LoginFormWithNext() {
  return <LoginForm next={useSearchParams().get("next") ?? ""} />;
}

export function LoginForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="step" value={state.step} />

      {state.message && (
        <p
          role={state.tone === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2.5 text-sm ${
            state.tone === "error"
              ? "bg-danger/10 text-danger"
              : "bg-info/10 text-info"
          }`}
        >
          {state.message}
        </p>
      )}

      {state.step === "password" ? (
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
              defaultValue={state.email}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={input}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`${input} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-5" />
                ) : (
                  <Eye aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
            <FieldError id="password-error" message={errors.password} />
          </div>

          <button type="submit" disabled={pending} className={submit}>
            {pending && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            )}
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={state.email ?? ""} />
          <div>
            <label htmlFor="otp" className="text-sm font-medium">
              Sign-in code
            </label>
            <p id="otp-hint" className="mt-1 text-sm text-muted">
              The 6-digit code sent to {state.email}.
            </p>
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              aria-invalid={errors.otp ? true : undefined}
              aria-describedby={errors.otp ? "otp-hint otp-error" : "otp-hint"}
              className={`${input} font-mono tracking-[0.5em]`}
            />
            <FieldError id="otp-error" message={errors.otp} />
          </div>

          <button type="submit" disabled={pending} className={submit}>
            {pending && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            )}
            {pending ? "Checking…" : "Verify and sign in"}
          </button>
          <button
            type="submit"
            name="intent"
            value="restart"
            formNoValidate
            disabled={pending}
            className="min-h-11 w-full rounded-lg text-sm font-medium text-muted hover:text-foreground"
          >
            Use a different account
          </button>
        </>
      )}
    </form>
  );
}
