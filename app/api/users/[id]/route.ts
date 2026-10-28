import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/users/:id", { method: "PATCH" });
export const DELETE = passThrough("/users/:id", { method: "DELETE" });
