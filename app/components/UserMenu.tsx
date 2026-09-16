"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { LinkButton } from "./Button";
import { Icon } from "./ui/design-system";

interface UserMenuProps {
  user: {
    email?: string;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex gap-3">
        <LinkButton href="/auth/login" variant="ghost" size="sm">
          Sign In
        </LinkButton>
        <LinkButton href="/auth/signup" size="sm">
          Sign Up
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-ink transition-colors hover:border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex size-8 items-center justify-center rounded-full border border-strong bg-blue-soft text-sm font-black text-on-accent">
          {user.email?.[0].toUpperCase() || "U"}
        </div>
        <span className="hidden max-w-40 truncate text-sm font-semibold text-ink sm:inline">
          {user.email?.split("@")[0]}
        </span>
        <Icon
          name="arrow-right"
          className={`size-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-control border border-border bg-surface p-1 shadow-card"
          role="menu"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-ink"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <Icon name="user" className="size-4" />
            Dashboard
          </Link>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted hover:bg-surface-muted hover:text-ink"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <Icon name="arrow-left" className="size-4" />
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
