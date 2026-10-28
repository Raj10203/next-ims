import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/auth/me", { method: "PATCH" });
