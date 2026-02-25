import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;

  const isMobileRoute = request.nextUrl.pathname.startsWith("/mobile");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // Proteger mobile
  if (isMobileRoute && !userId) {
    return NextResponse.redirect(new URL("/mobile/login", request.url));
  }

  // Proteger admin
  if (isAdminRoute && !userId) {
    return NextResponse.redirect(new URL("/mobile/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mobile/:path*", "/admin/:path*"],
};