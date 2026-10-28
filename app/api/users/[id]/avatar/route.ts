import { passThrough } from "@/lib/route-handler";

export const PUT = passThrough("/users/:id/avatar", {
  method: "PUT",
  form: true,
});
export const DELETE = passThrough("/users/:id/avatar", { method: "DELETE" });
