import { listThrough, passThrough } from "@/lib/route-handler";

export const GET = listThrough("/sites");
export const POST = passThrough("/sites");
