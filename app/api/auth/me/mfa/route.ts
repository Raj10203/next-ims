import { passThrough } from "@/lib/route-handler";

export const PUT = passThrough("/auth/me/mfa", { method: "PUT" });
