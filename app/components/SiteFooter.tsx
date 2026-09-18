"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = [
  { href: "/music-blog", label: "Music Blog" },
  { href: "/terms-of-use", label: "Terms of Use" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/legal-notice", label: "Legal Notice" },
  { href: "/contact", label: "Contact" },
  { href: "/delete-account", label: "Delete Account" },
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const hasAppNavigation =
    pathname !== "/" &&
    pathname !== "/music-blog" &&
    !pathname.startsWith("/auth/");

  return (
    <footer
      className={`paper-canvas border-t border-border bg-surface text-ink ${
        hasAppNavigation ? "pb-24 lg:ml-56 lg:pb-0" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex text-xl font-black tracking-[-0.03em] transition hover:text-coral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
            >
              Listen Exchange
            </Link>
            <p className="mt-2 text-sm leading-6 text-muted">
              Exchange listening between artists.
            </p>
          </div>

          <nav aria-label="Legal and support" className="md:text-right">
            <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-muted md:max-w-lg md:justify-end">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`rounded-sm transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-4 focus-visible:ring-offset-surface ${
                      pathname === link.href ? "text-coral-strong" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Not affiliated with or endorsed by Spotify.</p>
          <p>© 2026 Listen Exchange</p>
        </div>
      </div>
    </footer>
  );
}
