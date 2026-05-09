import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { AdminRole } from "@/lib/admin-roles";

export const adminSessionCookie = "restaurant_admin_session";

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "tenders123",
  };
}

export function getAccountantCredentials() {
  return {
    username: process.env.ACCOUNTANT_USERNAME || "accountant",
    password: process.env.ACCOUNTANT_PASSWORD || "tenders123",
  };
}

export function getCredentialsForRole(role: AdminRole) {
  return role === "accountant" ? getAccountantCredentials() : getAdminCredentials();
}

export function createAdminSessionToken(username: string, password: string, role: AdminRole) {
  return createHash("sha256")
    .update(`${username}:${password}:${role}:restaurant-admin-session`)
    .digest("hex");
}

export async function setAdminSessionCookie(role: AdminRole) {
  const { username, password } = getCredentialsForRole(role);
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookie, createAdminSessionToken(username, password, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookie);
}

export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(adminSessionCookie)?.value;

  for (const role of ["admin", "accountant"] as const) {
    const { username, password } = getCredentialsForRole(role);
    if (currentToken === createAdminSessionToken(username, password, role)) {
      return role;
    }
  }

  return null;
}
