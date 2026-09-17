"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/components/LogoutButton";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";
import {
  AppSidebar,
  BrandMark,
  CreditPill,
  MobileNav,
  type NavigationItem,
} from "@/app/components/ui/design-system";

export function Navbar() {
  const { user, isLoading } = useCurrentUser();
  const credits = user?.credits ?? 0;
  const [artistsListening, setArtistsListening] = useState(17);
  const [tracksListenedToday, setTracksListenedToday] = useState(80);
  const pathname = usePathname();

  useEffect(() => {
    const activityInterval = window.setInterval(() => {
      setArtistsListening((current) => {
        const nextStep = Math.floor(Math.random() * 3) - 1;
        return Math.min(30, Math.max(17, current + nextStep));
      });

      setTracksListenedToday((current) =>
        Math.random() > 0.65 ? Math.min(120, current + 1) : current,
      );
    }, 5200);

    return () => window.clearInterval(activityInterval);
  }, []);

  const items: NavigationItem[] = [
    {
      href: "/discover",
      label: "Discover",
      icon: "home",
      active: pathname === "/discover",
    },
    {
      href: "/submit",
      label: "Submit a track",
      icon: "upload",
      active: pathname === "/submit",
    },
    {
      href: "/my-tracks",
      label: "My tracks",
      icon: "music",
      active: pathname === "/my-tracks",
    },
    ...// user
    // ?
    [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "user" as const,
        active: pathname === "/dashboard",
      },
    ],
    // : [
    //     {
    //       href: "/auth/login",
    //       label: "Sign in",
    //       icon: "user" as const,
    //       active: pathname === "/auth/login",
    //     },
    //   ]
  ];

  const mobileItems: NavigationItem[] = [
    { href: "/", label: "Home", icon: "music", active: pathname === "/" },
    ...items,
  ];

  const liveActivity = (
    <div
      className="space-y-2 px-1"
      aria-label={`${artistsListening} artists listening and ${tracksListenedToday} tracks listened to today`}
    >
      <div className="flex items-center gap-2 text-[11px] leading-none text-muted">
        <span
          className="size-1.5 shrink-0 animate-pulse rounded-full bg-success motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span>
          <strong className="font-mono text-xs font-black tabular-nums text-ink">
            ~{artistsListening}
          </strong>{" "}
          artists listening
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] leading-none text-muted">
        <span
          className="size-1.5 shrink-0 animate-pulse rounded-full bg-coral motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span>
          <strong className="font-mono text-xs font-black tabular-nums text-ink">
            +{tracksListenedToday}
          </strong>{" "}
          tracks listened to today
        </span>
      </div>
    </div>
  );

  const accountPanel = isLoading ? (
    <div className="space-y-3 rounded-control border border-border bg-background p-3">
      <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
      <div className="h-9 animate-pulse rounded-control bg-surface-muted" />
    </div>
  ) : user ? (
    <div className="space-y-3 rounded-control border border-border bg-background p-3">
      <CreditPill credits={credits} />
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-soft text-xs font-black text-on-accent">
          {user.email[0]?.toUpperCase() || "U"}
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
          {user.email.split("@")[0]}
        </p>
      </div>
      <div className="flex items-center justify-end gap-1 border-t border-border pt-1.5">
        <Link
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
          className={`inline-flex min-h-6 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            pathname === "/contact"
              ? "bg-surface-muted text-ink"
              : "text-muted hover:bg-surface-muted hover:text-ink"
          }`}
        >
          Contact us
        </Link>
        <LogoutButton
          variant="ghost"
          className="!min-h-6 !rounded-md !px-2 !py-0.5 !text-[10px] text-muted"
        />
      </div>
    </div>
  ) : (
    <div className="rounded-control border border-border bg-background p-3">
      <p className="text-xs font-bold text-ink">Join the exchange</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Sign in to earn and allocate credits.
      </p>
      <Link
        href="/auth/signup"
        className="mt-3 inline-flex text-xs font-bold text-coral-strong hover:underline"
      >
        Create an account →
      </Link>
    </div>
  );

  const footer = (
    <div className="space-y-3">
      {liveActivity}
      {accountPanel}
      <ThemeToggle />
    </div>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AppSidebar items={items} footer={footer} />
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" aria-label="ListenExchange home">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {isLoading ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-surface-muted" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <CreditPill credits={credits} />
              <span className="grid size-9 place-items-center rounded-full border border-strong bg-blue-soft text-sm font-black text-on-accent">
                {user.email[0]?.toUpperCase() || "U"}
              </span>
            </div>
          ) : (
            <Link
              href="/auth/signup"
              className="rounded-full border border-strong bg-lime px-3 py-2 text-xs font-black text-on-accent"
            >
              Join
            </Link>
          )}
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
        <MobileNav items={mobileItems.slice(0, 4)} />
      </div>
    </>
  );
}
