import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormMessage } from "@/components/form";
import { SignOutButton } from "@/components/sign-out-button";
import { getSignedInUser } from "@/lib/auth";
import { safeNext } from "@/lib/paths";
import { VerifyEmailForm } from "./_components/verify-email-form";

export const metadata: Metadata = { title: "Verify your email" };

async function VerifyEmail({
  searchParams,
}: Pick<PageProps<"/verify-email">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  const result = await getSignedInUser();
  if (!result.ok) return <FormMessage message={result.error.message} />;
  if (result.data.emailVerifiedAt) redirect(next);
  return <VerifyEmailForm email={result.data.email} next={next} />;
}

function VerifyEmailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      <div className="h-10 skeleton rounded-lg" />
      <div className="h-11 skeleton rounded-lg" />
    </div>
  );
}

export default function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  return (
    <AuthCard
      title="Verify your email"
      description="Confirm your address with a code before you continue."
      footer={
        <SignOutButton className="inline-flex min-h-11 items-center font-medium text-primary hover:underline disabled:opacity-60">
          Sign out
        </SignOutButton>
      }
    >
      <Suspense fallback={<VerifyEmailSkeleton />}>
        <VerifyEmail searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
