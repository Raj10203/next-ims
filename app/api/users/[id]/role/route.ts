import { passThrough } from "@/lib/route-handler";

export const PUT = passThrough("/users/:id/role", { method: "PUT" });
