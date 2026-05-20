import { NextRequest, NextResponse } from "next/server";

const PITCH_HOSTS = new Set([
  "pitch.expaynse.xyz",
  "www.pitch.expaynse.xyz",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  if (!PITCH_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // Keep framework/static assets untouched for proper rendering.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/pitch";
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
