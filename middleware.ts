import { NextResponse, type NextRequest } from "next/server";
import { canAccessAdminRoute, defaultRouteForRole, type AdminRole } from "@/lib/admin-roles";

const adminSessionCookie = "restaurant_admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const role = await getRoleFromRequest(request);

    if (!role) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!canAccessAdminRoute(role, pathname)) {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }
  }

  if (pathname === "/admin/login") {
    const role = await getRoleFromRequest(request);

    if (role) {
      return NextResponse.redirect(new URL(defaultRouteForRole(role), request.url));
    }
  }

  return NextResponse.next();
}

async function createSessionToken(username: string, password: string, role: string) {
  const data = new TextEncoder().encode(`${username}:${password}:${role}:restaurant-admin-session`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getRoleFromRequest(request: NextRequest): Promise<AdminRole | null> {
  const currentToken = request.cookies.get(adminSessionCookie)?.value;
  if (!currentToken) return null;

  const credentials: Record<AdminRole, { username: string; password: string }> = {
    admin: {
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "roma123",
    },
    accountant: {
      username: process.env.ACCOUNTANT_USERNAME || "accountant",
      password: process.env.ACCOUNTANT_PASSWORD || "roma123",
    },
  };

  for (const role of ["admin", "accountant"] as const) {
    const { username, password } = credentials[role];
    if (currentToken === await createSessionToken(username, password, role)) {
      return role;
    }
  }

  return null;
}

export const config = {
  matcher: ["/admin/:path*"],
};
