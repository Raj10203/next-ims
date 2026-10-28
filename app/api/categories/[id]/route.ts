import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/categories/:id", { method: "PATCH" });
export const DELETE = passThrough("/categories/:id", { method: "DELETE" });
