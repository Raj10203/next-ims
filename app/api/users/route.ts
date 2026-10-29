import { listThrough, passThrough } from "@/lib/route-handler";

export const GET = listThrough("/users");
export const POST = passThrough("/users");
