import type { Metadata } from "next";
import { Suspense } from "react";
import { FormMessage } from "@/components/form";
import { getCurrentUser } from "@/lib/auth";
import { MfaForm } from "./_components/mfa-form";

export const metadata: Metadata = { title: "My profile" };

async function MfaSetting() {
  const result = await getCurrentUser();
  if (!result.ok) return <FormMessage message={result.error.message} />;
  return <MfaForm enabled={result.data.mfaEnabled} />;
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        My profile
      </h1>

      <section
        aria-labelledby="security-heading"
        className="max-w-xl rounded-xl border border-border bg-surface p-5 sm:p-6"
      >
        <h2 id="security-heading" className="text-lg font-semibold">
          Sign-in code
        </h2>
        <p className="mt-1 text-sm text-muted">
          When this is on, signing in also needs a 6-digit code that we email to
          you.
        </p>
        <div className="mt-5">
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="h-32 animate-pulse rounded-lg bg-surface-muted"
              />
            }
          >
            <MfaSetting />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
