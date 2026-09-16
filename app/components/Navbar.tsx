"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/components/LogoutButton";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { createClient } from "@/app/lib/supabase/client";
import { getUserProfile } from "@/app/actions/feedback";
import {
  CREDITS_UPDATED_EVENT,
  type CreditsUpdatedDetail,
} from "@/app/lib/credits-events";
import {
  AppSidebar,
  BrandMark,
  CreditPill,
  MobileNav,
  type NavigationItem,
} from "@/app/components/ui/design-system";

interface User {
  id: string;
  email: string;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = await createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email || "" });
          try {
            const profile = await getUserProfile();
            setCredits(profile?.credits ?? 0);
          } catch (error) {
            console.error("Error fetching profile:", error);
            setCredits(0);
          }
        } else {
          setUser(null);
          setCredits(0);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
        setCredits(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleCreditsUpdated = async (event: Event) => {
      const { balance } =
        (event as CustomEvent<CreditsUpdatedDetail>).detail ?? {};

      if (typeof balance === "number") {
        setCredits(balance);
        return;
      }

      try {
        const profile = await getUserProfile();
        setCredits(profile?.credits ?? 0);
      } catch (error) {
        console.error("Error refreshing profile credits:", error);
      }
    };

    window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);

    return () => {
      window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);
    };
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
    ...(user
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: "user" as const,
            active: pathname === "/dashboard",
          },
        ]
      : [
          {
            href: "/auth/login",
            label: "Sign in",
            icon: "user" as const,
            active: pathname === "/auth/login",
          },
        ]),
  ];

  const mobileItems: NavigationItem[] = [
    { href: "/", label: "Home", icon: "music", active: pathname === "/" },
    ...items,
  ];

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
      <LogoutButton variant="ghost" className="w-full" />
    </div>
  ) : (
    <div className="rounded-control border border-border bg-background p-3">
      <p className="text-xs font-bold text-ink">Join the exchange</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Sign in to earn and allocate listens.
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
