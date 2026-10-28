import { NextResponse, type NextRequest } from "next/server";
import { forward, readRequest } from "@/lib/route-handler";
import { clearSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const read = await readRequest(request);
  if (read instanceof NextResponse) return read;
  // Revokes the refresh token on the API; the cookies go either way.
  await forward(request, "/auth/logout");
  await clearSession();
  return new NextResponse(null, { status: 204 });
}
