import { passThrough } from "@/lib/route-handler";

export const PATCH = passThrough("/stock-requests/:id/route", {
  method: "PATCH",
});
