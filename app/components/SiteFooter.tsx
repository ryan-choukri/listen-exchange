"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Icon,
  type IconName,
} from "@/app/components/ui/design-system";

const footerSections: Array<{
  title: string;
  icon: IconName;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Music Blog",
    icon: "music",
    links: [
      { href: "/music-blog", label: "Music Blog" },
      {
        href: "/spotify-listening-exchange",
        label: "Spotify Listening Exchange",
      },
      { href: "/free-spotify-promotion", label: "Free Spotify Promotion" },
      {
        href: "/how-to-get-more-spotify-streams",
        label: "Get More Spotify Streams",
      },
      { href: "/submithub-alternatives", label: "SubmitHub Alternatives" },
      {
        href: "/how-to-get-people-to-listen-to-your-music",
        label: "Get People to Listen",
      },
    ],
  },
  {
    title: "Platform",
    icon: "users",
    links: [
      { href: "/submit", label: "Submit a Track" },
      { href: "/my-tracks", label: "My Tracks" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    icon: "chart",
    links: [
      { href: "/free-spotify-streams", label: "Free Spotify Streams" },
      {
        href: "/free-spotify-playlist-submission",
        label: "Playlist Submission",
      },
      {
        href: "/spotify-promotion-without-money",
        label: "Promotion Without Money",
      },
      { href: "/submithub-alternatives", label: "SubmitHub Alternatives" },
    ],
  },
  {
    title: "Legal",
    icon: "lock",
    links: [
      { href: "/terms-of-use", label: "Terms of Use" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/legal-notice", label: "Legal Notice" },
      { href: "/delete-account", label: "Delete Account" },
    ],
  },
];

function FooterBrand() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 xl:block">
      <Link
        href="/"
        aria-label="Listen Exchange home"
        className="group inline-flex items-center gap-2.5 rounded-sm text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-4 focus-visible:ring-offset-inverse-surface sm:gap-3"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 72 44"
          className="h-9 w-14 text-lime transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-[72px]"
          fill="none"
        >
          <path
            d="M2 23h8l4-13 6 27 7-34 7 37 7-31 6 28 6-23 5 18 5-9h7"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xl font-black leading-[0.92] tracking-[-0.045em] sm:text-[1.7rem]">
          <span className="block">Listen</span>
          <span className="block">Exchange</span>
        </span>
      </Link>

      <p className="col-span-2 max-w-[22rem] text-[13px] leading-5 text-inverse-foreground/68 sm:text-sm sm:leading-6 xl:mt-5 xl:max-w-[19rem]">
        A community of independent artists exchanging real Spotify listens.
      </p>

      <div className="col-start-2 row-start-1 min-w-0 self-center xl:mt-6">
        <p className="-rotate-1 font-marker text-base leading-[1.15] text-inverse-foreground/72 sm:text-lg">
          Real artists. Real listens.
          <br />
          A louder tomorrow.
        </p>
        <span
          aria-hidden="true"
          className="mt-2 block h-0.5 w-24 max-w-full -rotate-3 rounded-full bg-lime/85 sm:w-32"
        />
      </div>
    </div>
  );
}

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const hasAppNavigation =
    ![
      "/",
      "/music-blog",
      "/spotify-listening-exchange",
      "/free-spotify-promotion",
      "/how-to-get-more-spotify-streams",
      "/free-spotify-streams",
      "/spotify-promotion-without-money",
      "/free-spotify-playlist-submission",
      "/submithub-alternatives",
      "/how-to-get-people-to-listen-to-your-music",
    ].includes(pathname) && !pathname.startsWith("/auth/");

  return (
    <footer
      className={`relative overflow-hidden border-t border-inverse-foreground/10 bg-inverse-surface text-inverse-foreground ${
        hasAppNavigation ? "pb-20 lg:ml-56 lg:pb-0" : ""
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(255_255_255/0.018)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.018)_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-[8%] h-56 w-[48rem] -rotate-3 rounded-[50%] bg-lime/[0.025] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 xl:px-10 xl:py-12">
        <div className="grid gap-7 sm:gap-8 xl:grid-cols-[minmax(220px,0.72fr)_minmax(590px,2.25fr)_minmax(250px,0.8fr)] xl:gap-8 2xl:gap-10">
          <FooterBrand />

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-0"
          >
            {footerSections.map((section) => (
              <section
                key={section.title}
                aria-labelledby={`footer-${section.title.toLowerCase().replace(" ", "-")}`}
                className="border-l border-inverse-foreground/10 pl-3 sm:pl-5 lg:px-5"
              >
                <h2
                  id={`footer-${section.title.toLowerCase().replace(" ", "-")}`}
                  className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-inverse-foreground/62 sm:text-[10px] sm:tracking-[0.2em] xl:text-[11px]"
                >
                  <Icon
                    name={section.icon}
                    className="size-4 shrink-0 text-lime sm:size-[18px]"
                  />
                  {section.title}
                </h2>
                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5 xl:mt-5 xl:space-y-3">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.href}`}>
                      <Link
                        href={link.href}
                        aria-current={pathname === link.href ? "page" : undefined}
                        className={`rounded-sm text-[11px] leading-[15px] transition-colors hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-4 focus-visible:ring-offset-inverse-surface sm:text-xs sm:leading-4 xl:text-sm xl:leading-5 ${
                          pathname === link.href
                            ? "font-bold text-lime"
                            : "text-inverse-foreground/82"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <aside className="self-start rounded-card border border-inverse-foreground/16 bg-inverse-foreground/[0.025] p-3.5 shadow-card sm:p-5 xl:p-6">
            <Icon name="sparkle" className="size-5 text-lime sm:size-6" />
            <h2 className="mt-2.5 text-lg font-black leading-tight tracking-[-0.035em] text-inverse-foreground sm:mt-3 sm:text-2xl">
              Independent music goes further together.
            </h2>
            <p className="mt-2 text-xs leading-5 text-inverse-foreground/64 sm:text-sm sm:leading-6">
              Exchange listens. Discover new artists. Grow your music.
            </p>
            <Link
              href="/auth/signup"
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-control border border-lime-strong bg-lime px-4 py-2 text-xs font-black text-on-accent shadow-[0_8px_24px_rgb(198_246_91/0.08)] transition hover:bg-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-4 focus-visible:ring-offset-inverse-surface sm:mt-4 sm:min-h-10 sm:py-2.5 sm:text-sm"
            >
              Join the community
              <Icon name="arrow-right" className="size-4 sm:size-5" />
            </Link>
          </aside>
        </div>

        <div className="mt-6 flex flex-col gap-1.5 border-t border-inverse-foreground/12 pt-3.5 text-[10px] text-inverse-foreground/52 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-4 sm:text-[11px] lg:mt-10">
          <p className="flex items-center gap-2">
            <Icon
              name="spotify"
              className="size-5 shrink-0 text-inverse-foreground/58"
            />
            Not affiliated with or endorsed by Spotify.
          </p>
          <p>© 2026 Listen Exchange. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
