import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginForm, LoginFormWithNext } from "./_components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="h-12 max-w-48" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to IMS
          </h1>
          <p className="mt-1 text-sm text-muted">
            Use the email address your administrator added.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <Suspense fallback={<LoginForm />}>
          <LoginFormWithNext />
        </Suspense>
      </div>

      <p className="text-center text-sm text-muted">
        No account? Ask your administrator to add you.
      </p>
    </div>
  );
}
