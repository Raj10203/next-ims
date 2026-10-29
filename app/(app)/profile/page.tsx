import type { Metadata } from "next";
import { Suspense } from "react";
import { AvatarForm } from "@/components/avatar-form";
import { PageLayout } from "@/components/page-layout";
import { DetailList, Section } from "@/components/section";
import { DetailSkeleton, LoadError } from "@/components/states";
import { fullName, getCurrentUser, roleLabel } from "@/lib/auth";
import { ChangePasswordForm } from "./_components/change-password-form";
import { MfaForm } from "./_components/mfa-form";
import { NameForm } from "./_components/name-form";

export const metadata: Metadata = { title: "My profile" };

async function Profile() {
  const result = await getCurrentUser();
  if (!result.ok) return <LoadError error={result.error} />;
  const user = result.data;

  return (
    <div className="space-y-6">
      <Section id="account" title="Account">
        <DetailList
          rows={[
            ["Email", user.email],
            ["Role", roleLabel(user.role.name)],
            [
              "Feature roles",
              user.featureRoles.length
                ? user.featureRoles
                    .map((grant) => roleLabel(grant.role.name))
                    .join(", ")
                : "None",
            ],
          ]}
        />
        <p className="mt-4 text-sm text-muted">
          An admin changes your email, role and site.
        </p>
      </Section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section id="photo" title="Photo">
          <AvatarForm
            userId={user.id}
            name={fullName(user)}
            avatarUrl={user.avatarUrl}
          />
        </Section>

        <Section id="name" title="Name">
          <NameForm
            firstName={user.firstName}
            middleName={user.middleName}
            lastName={user.lastName}
          />
        </Section>

        <Section
          id="password"
          title="Password"
          description="Changing it signs you out on every other device."
        >
          <ChangePasswordForm />
        </Section>

        <Section
          id="security"
          title="Sign-in code"
          description="When this is on, signing in also needs a 6-digit code that we email to you."
        >
          <MfaForm enabled={user.mfaEnabled} />
        </Section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PageLayout title="My profile">
      <Suspense fallback={<DetailSkeleton />}>
        <Profile />
      </Suspense>
    </PageLayout>
  );
}
