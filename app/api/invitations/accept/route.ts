import { passThrough } from "@/lib/route-handler";
import { clearSession } from "@/lib/session";

// Serves the invitation and the password reset link. The API signs out every
// session of that account, so this browser's cookies go too.
export const POST = passThrough("/invitations/accept", {
  onSuccess: clearSession,
});
