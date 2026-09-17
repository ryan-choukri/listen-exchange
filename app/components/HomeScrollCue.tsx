"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui/design-system";

export function HomeScrollCue() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY < 120);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <Link
      href="#how-it-works"
      aria-label="Scroll to how ListenExchange works"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? undefined : -1}
      className={`fixed bottom-5 left-1/2 z-30 inline-flex -translate-x-1/2 flex-col items-center gap-0.5 whitespace-nowrap rounded-full border border-border bg-surface/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink shadow-card backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong lg:absolute lg:bottom-10 lg:bg-transparent lg:text-xs lg:text-muted lg:shadow-none lg:backdrop-blur-none lg:hover:text-ink ${isVisible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
    >
      How it works
      <Icon name="chevron-down" className="size-4 animate-bounce lg:size-5" />
    </Link>
  );
}
