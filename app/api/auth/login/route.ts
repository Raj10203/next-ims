import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ApiUser } from "@/lib/auth";
import { passThrough, signedIn } from "@/lib/route-handler";
import { MFA_COOKIE, cookieOptions, type TokenPair } from "@/lib/session";

type CodeRequired = {
  mfaRequired: true;
  challengeToken: string;
  expiresInMinutes: number;
  message: string;
};

export const POST = passThrough<({ user: ApiUser } & TokenPair) | CodeRequired>(
  "/auth/login",
  {
    async onSuccess(data) {
      if (!("mfaRequired" in data)) return signedIn(data);
      // Kept for the code step (POST /api/auth/login/mfa), never sent to the page.
      const { challengeToken, ...codeStep } = data;
      (await cookies()).set({
        name: MFA_COOKIE,
        value: challengeToken,
        maxAge: data.expiresInMinutes * 60,
        ...cookieOptions,
      });
      return NextResponse.json(codeStep);
    },
  },
);
