import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/products/:id", { method: "PATCH" });
export const DELETE = passThrough("/products/:id", { method: "DELETE" });
