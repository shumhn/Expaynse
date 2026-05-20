import { NextRequest, NextResponse } from "next/server";

const PITCH_HOSTS = new Set([
  "pitch.expaynse.xyz",
  "www.pitch.expaynse.xyz",
]);

const PUBLIC_FILE_REGEX = /\.[a-z0-9]+$/i;

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
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/images") ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/pitch";
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"],
};
