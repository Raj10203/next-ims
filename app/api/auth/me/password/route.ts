import { NextResponse } from "next/server";
import { passThrough } from "@/lib/route-handler";
import { saveSession, type TokenPair } from "@/lib/session";

// nest-ims ends every other session and answers a new token pair, which
// replaces this one like a refresh.
export const PUT = passThrough<TokenPair & { message: string }>(
  "/auth/me/password",
  {
    method: "PUT",
    async onSuccess({ message, ...tokens }) {
      await saveSession(tokens);
      return NextResponse.json({ message });
    },
  },
);
