"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import {
  BrandMark,
  Icon,
  type IconName,
} from "@/app/components/ui/design-system";

const navigation: Array<{
  href: string;
  label: string;
  icon: IconName;
}> = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/tracks", label: "Tracks", icon: "music" },
  { href: "/admin/listening", label: "Listening", icon: "headphones" },
  { href: "/admin/messages", label: "Messages", icon: "message" },
  { href: "/admin/settings", label: "Settings", icon: "sparkle" },
];

function AdminNavigation({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Admin navigation">
      <ul className="flex gap-2 lg:flex-col">
        {navigation.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-control px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong ${
                  active
                    ? "bg-surface-muted text-lime"
                    : "text-muted hover:bg-surface-muted/70 hover:text-ink"
                }`}
              >
                <Icon name={item.icon} className="size-4.5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AdminShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const displayName = email.split("@")[0] || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-ink lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-surface/70 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-4">
        <Link href="/admin" className="rounded-control px-2 py-2">
          <BrandMark />
        </Link>

        <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          Admin
        </p>
        <AdminNavigation pathname={pathname} />

        <div className="mt-auto rounded-card border border-border bg-background/60 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-success">
            <span className="size-2 rounded-full bg-success" />
            Protected access
          </p>
          <p className="mt-1.5 text-xs leading-5 text-muted">
            Server-verified superadmin session
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/admin" className="lg:hidden">
              <BrandMark compact />
            </Link>
            <p className="hidden text-sm text-muted sm:block">
              Listen Exchange administration
            </p>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle compact />
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div className="grid size-9 place-items-center rounded-full border border-border bg-surface-muted text-xs font-black">
                {initial}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-44 truncate text-xs font-bold text-ink">
                  {displayName}
                </p>
                <p className="text-[11px] text-muted">Superadmin</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            <AdminNavigation pathname={pathname} />
          </div>
        </header>

        <main className="mx-auto max-w-[96rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
