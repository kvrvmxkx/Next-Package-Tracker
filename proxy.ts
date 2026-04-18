import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — toujours accessibles
  const publicPaths = ["/login", "/setup", "/suivi", "/api/auth", "/api/suivi"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // API routes — gérées par les routes elles-mêmes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Vérifier la session
  const session = getSessionCookie(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
