import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import {
  SetPasswordForm,
  SetPasswordFormWithToken,
} from "./_components/set-password-form";

// Invitation and password reset emails link here with ?token= (INVITE_PATH in
// nest-ims): keep the path. no-referrer keeps the token out of requests for
// images and links on this page.
export const metadata: Metadata = {
  title: "Set your password",
  referrer: "no-referrer",
};

export default function SetPasswordPage() {
  return (
    <AuthCard
      title="Set your password"
      description="Choose the password you will sign in with."
      footer="Link not working? Ask your administrator for a new invitation, or use “Forgot password?” on the sign-in page."
    >
      <Suspense fallback={<SetPasswordForm token={null} />}>
        <SetPasswordFormWithToken />
      </Suspense>
    </AuthCard>
  );
}
