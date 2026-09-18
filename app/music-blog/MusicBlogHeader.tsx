import Link from "next/link";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { UserMenu } from "@/app/components/UserMenu";
import { BrandMark } from "@/app/components/ui/design-system";

const navigation = [
  { href: "/discover", label: "Discover" },
  { href: "/submit", label: "Submit a Track" },
  { href: "/music-blog", label: "Music Blog", active: true },
  { href: "/#how-it-works", label: "How it works" },
];

export function MusicBlogHeader() {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="ListenExchange home"
          className="shrink-0 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
        >
          <BrandMark />
        </Link>

        <nav
          aria-label="Public navigation"
          className="ml-4 hidden min-w-0 flex-1 md:block"
        >
          <ul className="flex items-center gap-1 lg:gap-3">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`relative inline-flex min-h-10 items-center rounded-control px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                    item.active
                      ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-coral"
                      : "text-muted hover:bg-surface-muted/60 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <UserMenu />
        </div>
      </div>

      <nav
        aria-label="Mobile public navigation"
        className="overflow-x-auto border-t border-border px-4 md:hidden"
      >
        <ul className="flex min-w-max items-center gap-1 py-2">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold ${
                  item.active
                    ? "border-coral bg-coral/15 text-ink"
                    : "border-border bg-surface text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
