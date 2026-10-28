import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { ApiUser } from "@/lib/auth";
import {
  errorResponse,
  forward,
  readRequest,
  signedIn,
  toResponse,
} from "@/lib/route-handler";
import { MFA_COOKIE, type TokenPair } from "@/lib/session";

// The page sends { otp }; the challenge token comes from the cookie the
// login step set.
export async function POST(request: NextRequest) {
  const read = await readRequest(request);
  if (read instanceof NextResponse) return read;
  const store = await cookies();
  const challengeToken = store.get(MFA_COOKIE)?.value;
  if (!challengeToken) {
    return errorResponse(
      401,
      "Unauthorized",
      "The sign-in code has expired. Sign in again.",
    );
  }

  const fields = typeof read.body === "object" && read.body ? read.body : {};
  const result = await forward<{ user: ApiUser } & TokenPair>(
    request,
    "/auth/login/mfa",
    { body: { ...fields, challengeToken } },
  );
  if (!result.ok) return toResponse(result);
  store.delete(MFA_COOKIE);
  return signedIn(result.data);
}
