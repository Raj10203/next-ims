import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { LoginForm, LoginFormWithNext } from "./_components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in to IMS"
      description="Use the email address your administrator added."
      footer="No account? Ask your administrator to add you."
    >
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithNext />
      </Suspense>
    </AuthCard>
  );
}
