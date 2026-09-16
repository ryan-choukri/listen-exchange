import Link from "next/link";
import { LinkButton } from "./components/Button";
import { UserMenu } from "./components/UserMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import { getUser } from "./actions/auth";
import { BrandMark, Icon, Surface } from "./components/ui/design-system";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="paper-canvas min-h-screen overflow-hidden bg-background text-ink">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="ListenExchange home">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <aside
            aria-label="ListenExchange is completely free"
            className="pointer-events-none absolute left-1/2 top-[10px] z-30 w-20 -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-control border-2 border-strong bg-blue-soft px-3 py-2 text-center text-on-accent shadow-raised sm:w-50"
          >
            <p className="text-base text-xs sm:text-xl font-black leading-none tracking-tight">
              100% FREE
            </p>
            <p className="hidden sm:block mt-1 text-[9px] font-bold leading-3">
              No subscription. No paywall.
            </p>
            <p className="hidden sm:block mt-1 font-marker text-[11px] leading-none">
              Spend time, not money.
            </p>
          </aside>

          <div className="relative z-10">
            <p className="inline-flex -rotate-1 items-center gap-2 rounded-full border border-strong bg-lime px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-on-accent shadow-raised">
              <Icon name="sparkle" className="size-4" />
              Exchange listening between artists
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
              No budget for music promotion.
              <span className="mt-2 block font-marker text-[0.72em]  font-normal leading-none text-coral-strong">
                use your time instead !
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
              Listen to other artists, leave real feedback, and get your own
              music heard in return. A simple exchange between artists.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/discover" size="lg" icon="play">
                Start Listening
              </LinkButton>
              <LinkButton
                href="/submit"
                size="lg"
                variant="outline"
                icon="upload"
              >
                Submit a Track
              </LinkButton>
            </div>

            <p className="mt-7 flex items-center gap-2 font-marker text-lg text-ink">
              <span className="h-1 w-10 -rotate-2 rounded-full bg-coral" />
              Music connects good people.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -left-8 -top-9 -rotate-6 rounded-control bg-blue-soft px-5 py-4 font-marker text-lg leading-tight text-on-accent shadow-card">
              Listen.
              <br />
              Share.
              <br />
              Support.
            </div>
            <Surface className="relative overflow-hidden border-2 border-strong p-5 shadow-raised sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    The exchange System
                  </p>
                  <h2 className="mt-2 text-xl font-black text-ink">
                    Your song gonna be listened
                  </h2>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-strong bg-coral text-on-accent">
                  <Icon name="headphones" />
                </span>
              </div>

              <div className="mt-7 space-y-3">
                {[
                  ["play", "Discover", "Explore independent tracks"],
                  ["message", "Feedback", "Share meaningful reviews"],
                  [
                    "trophy",
                    "Earn",
                    "Earn listens for your own tracks",
                  ],
                ].map(([icon, title, description], index) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-control border border-border bg-background p-3.5"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-coral/25" : index === 1 ? "bg-blue-soft/45" : "bg-lime/50"}`}
                    >
                      <Icon
                        name={icon as "play" | "message" | "trophy"}
                        className="size-5"
                      />
                    </span>
                    <div>
                      <h3 className="font-black text-ink">{title}</h3>
                      <p className="text-sm text-muted">
                        {index === 2 ? (
                          <strong className="text-italic text-ink">
                            {description}
                          </strong>
                        ) : (
                          description
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
            <p className="absolute -bottom-10 right-2 rotate-2 rounded-control bg-lime px-4 py-3 font-marker text-base text-on-accent shadow-card">
              1 listen = 1 artist pushed further.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
