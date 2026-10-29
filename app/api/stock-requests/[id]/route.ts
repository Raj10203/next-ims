import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/stock-requests/:id", { method: "PATCH" });
export const DELETE = passThrough("/stock-requests/:id", { method: "DELETE" });
