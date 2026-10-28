import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/sites/:id", { method: "PATCH" });
export const DELETE = passThrough("/sites/:id", { method: "DELETE" });
