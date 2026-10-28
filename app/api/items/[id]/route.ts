import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/items/:id", { method: "PATCH" });
export const DELETE = passThrough("/items/:id", { method: "DELETE" });
