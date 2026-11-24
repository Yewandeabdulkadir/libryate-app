import type { UserRole } from "@/lib/database.types";

/** Pages anyone can open without logging in. */
const PUBLIC_PATHS = ["/", "/welcome", "/login", "/signup", "/verify", "/forgot-password", "/auth/confirm", "/privacy"];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.includes(path) || path.startsWith("/auth/");
}

/** Where each kind of user lands after logging in. */
export function homeFor(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "author":
      return "/author";
    default:
      return "/catalogue";
  }
}

/**
 * Only follow "next" links that stay on this site, so a crafted link cannot
 * send someone to another website after they log in.
 */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
