import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const role = request.cookies.get("role")?.value;

  const { pathname } = request.nextUrl;

  const isMobileRoute = pathname.startsWith("/mobile");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const merchandAdminRoutes = [
    "/admin",
    "/admin/store-summary",
    "/admin/commercial-dashboard",
  ];

  // 🔐 No login
  if ((isMobileRoute || isAdminRoute || isDashboardRoute) && !userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔒 USER no puede entrar a admin
  if (isAdminRoute && role === "USER") {
    return NextResponse.redirect(new URL("/mobile", request.url));
  }

  if (
    isAdminRoute &&
    role === "MERCHAND" &&
    !merchandAdminRoutes.some(
      (route) =>
        route === "/admin"
          ? pathname === route
          : pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 🔒 SUPERVISOR no puede entrar a secciones exclusivas
  if (
    isAdminRoute &&
    role === "SUPERVISOR" &&
    (pathname.startsWith("/admin/import") ||
     pathname.startsWith("/admin/user-stores") ||
     pathname.startsWith("/admin/products") ||
     pathname.startsWith("/admin/stores"))
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mobile/:path*", "/admin/:path*", "/dashboard/:path*"],
};
