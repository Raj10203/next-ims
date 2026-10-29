import { listThrough, passThrough } from "@/lib/route-handler";

export const GET = listThrough("/categories");
export const POST = passThrough("/categories");
