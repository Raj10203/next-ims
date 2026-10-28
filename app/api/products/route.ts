import { listThrough, passThrough } from "@/lib/route-handler";

export const GET = listThrough("/products");
export const POST = passThrough("/products");
