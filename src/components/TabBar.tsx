"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/database.types";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const HOME = "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z";
const SEARCH = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3";
const BOOKS = "M4 4h5v16H4zM10 4h4v16h-4zM15 5l4-1 3 15-4 1z";
const USER = "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0";
const SHIELD = "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z";
const PEN = "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3";

const TABS: Record<UserRole, [string, string, string][]> = {
  student: [
    ["/catalogue", "Home", HOME],
    ["/search", "Search", SEARCH],
    ["/shelf", "My Shelf", BOOKS],
    ["/profile", "Profile", USER],
  ],
  author: [
    ["/author", "Dashboard", PEN],
    ["/catalogue", "Catalogue", HOME],
    ["/profile", "Profile", USER],
  ],
  admin: [
    ["/admin", "Admin", SHIELD],
    ["/catalogue", "Catalogue", HOME],
    ["/profile", "Profile", USER],
  ],
};

export function TabBar({ role }: { role: UserRole }) {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Main">
      <div className="in">
        {TABS[role].map(([href, label, d]) => (
          <Link key={href} href={href} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>
            {icon(d)}
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
