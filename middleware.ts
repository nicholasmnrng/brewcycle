import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { AppRole } from "@/config/navigation";

const { auth } = NextAuth(authConfig);

const roleRoutes: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/dashboard/pickup", roles: ["CAFE"] },
  { prefix: "/dashboard/history", roles: ["CAFE", "DRIVER", "BUYER"] },
  { prefix: "/dashboard/rewards", roles: ["CAFE", "BUYER"] },
  { prefix: "/dashboard/tasks", roles: ["DRIVER"] },
  { prefix: "/dashboard/map", roles: ["DRIVER"] },
  { prefix: "/dashboard/products", roles: ["ADMIN", "BUYER"] },
  { prefix: "/dashboard/orders", roles: ["ADMIN"] },
  { prefix: "/dashboard/impact", roles: ["ADMIN", "CAFE"] },
  { prefix: "/dashboard/cart", roles: ["BUYER"] },
  { prefix: "/dashboard/logistics", roles: ["ADMIN"] },
  { prefix: "/dashboard/reports", roles: ["ADMIN"] },
  { prefix: "/dashboard/promos", roles: ["ADMIN"] },
  { prefix: "/dashboard/master-data", roles: ["ADMIN"] },
  { prefix: "/dashboard/audit-log", roles: ["ADMIN"] },
  { prefix: "/dashboard/gamification", roles: ["ADMIN"] },
  { prefix: "/dashboard/settings", roles: ["ADMIN"] }
];

export default auth((request) => {
  const { nextUrl, auth: session } = request;
  const pathname = nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (pathname.startsWith("/dashboard") && !session?.user) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  const protectedRoute = roleRoutes.find((route) => pathname.startsWith(route.prefix));

  if (protectedRoute && session?.user && !protectedRoute.roles.includes(session.user.role)) {
    const url = new URL("/dashboard", nextUrl);
    url.searchParams.set("forbidden", "role");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*"]
};
