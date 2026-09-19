import type { Metadata } from "next";
import Link from "next/link";
import { Icon, Surface } from "@/app/components/ui/design-system";
import { PublicHeader } from "@/app/music-blog/MusicBlogHeader";

export const metadata: Metadata = {
  title: "I Made a Plays Exchange Platform for Musicians on Spotify",
  description:
    "Get more Spotify listens by exchanging listens with other independent artists. I built ListenExchange to make music promotion simpler.",
};

const comparisonRows = [
  {
    method: "Playlist curators",
    action: "Submit and pitch your track",
    result: "Possible playlist placement",
  },
  {
    method: "Reddit",
    action: "Post in music communities",
    result: "Possible clicks and feedback",
  },
  {
    method: "SubmitHub",
    action: "Submit to curators",
    result: "Possible feedback or placement",
  },
  {
    method: "ListenExchange",
    action: "Listen to other artists",
    result: "Other artists listen to your Spotify track",
  },
] as const;

const exchangeSteps = [
  "Listen to Spotify tracks from other independent artists.",
  "Earn credits.",
  "Add those credits to your own Spotify track.",
  "Other artists listen to your track in return.",
] as const;

export default function SpotifyListeningExchangePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "I made a plays exchange platform for Musicians on Spotify",
    description:
      "Get more Spotify listens by exchanging listens with other independent artists. I built ListenExchange to make music promotion simpler.",
    mainEntityOfPage:
      "https://listen-exchange.com/spotify-listening-exchange",
    publisher: {
      "@type": "Organization",
      name: "ListenExchange",
      url: "https://listen-exchange.com",
    },
  };

  return (
    <div className="paper-canvas min-h-screen bg-background text-ink">
      <PublicHeader activeHref={null} />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <article>
          <header className="border-b border-border pb-9 sm:pb-12">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-coral-strong">
              Independent music promotion
            </p>
            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-7xl">
              I made a plays exchange platform for Musicians on Spotify
            </h1>
            <div className="mt-7 max-w-3xl space-y-4 text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              <p className="font-semibold text-ink">
                ListenExchange is a free Spotify listening exchange where
                independent artists listen to each other&apos;s tracks to get more
                real Spotify listens.
              </p>
              <p>
                You listen to music from other independent artists, and other
                artists listen to your Spotify track in return. It is a direct
                exchange, built around one simple action: pressing play.
              </p>
            </div>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
            <div className="min-w-0 space-y-12">
              <section aria-labelledby="why-i-built-it">
                <h2
                  id="why-i-built-it"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  Why I built it
                </h2>
                <div className="mt-5 space-y-5 text-base leading-8 text-muted sm:text-lg">
                  <p>
                    Promoting music on Spotify as an independent artist is
                    difficult. I kept running into the same options: playlist
                    curators, Reddit promotion and platforms like SubmitHub.
                    They can all be useful, but the process is often slow,
                    uncertain or focused on being selected by someone else.
                  </p>
                  <p>I wanted something simpler:</p>
                  <blockquote className="rounded-card border border-coral/70 bg-coral/10 px-5 py-5 text-xl font-black leading-8 text-ink shadow-card sm:px-7 sm:text-2xl">
                    I listen to other independent artists. Other independent
                    artists listen to me.
                  </blockquote>
                  <p>
                    I could not find a platform focused on that simple
                    listening exchange, so I built ListenExchange.
                  </p>
                </div>
              </section>

              <section aria-labelledby="promotion-options">
                <h2
                  id="promotion-options"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  The music promotion options I kept finding
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">
                      Spotify playlist curators
                    </h3>
                    <p className="mt-3 leading-7 text-muted">
                      You need to find curators who fit your sound, submit your
                      track, write a pitch and wait. A good match can help, but
                      there is no guarantee that your song will be placed.
                    </p>
                  </section>

                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">Reddit</h3>
                    <p className="mt-3 leading-7 text-muted">
                      You need to find communities that allow music promotion,
                      follow their self-promo rules and compete with many other
                      artists for attention. It can work, but getting actual
                      listeners can take time.
                    </p>
                  </section>

                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">SubmitHub</h3>
                    <p className="mt-3 leading-7 text-muted">
                      SubmitHub is useful for pitching curators, blogs and
                      playlists. Free submissions are limited, and premium
                      submissions still do not guarantee promotion or playlist
                      placement.
                    </p>
                  </section>

                  <section className="rounded-card border border-coral/70 bg-coral/5 p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">
                      ListenExchange
                    </h3>
                    <p className="mt-3 leading-7 text-muted">
                      ListenExchange is not another curator inbox. It connects
                      artists who are ready to listen to one another directly,
                      using a clear credit exchange.
                    </p>
                  </section>
                </div>

                <p className="mt-5 leading-7 text-muted">
                  These platforms solve different problems. ListenExchange
                  does not replace playlist pitching, community promotion or
                  curator feedback. It adds a simpler way to reach real
                  listeners.
                </p>
              </section>

              <section aria-labelledby="how-the-exchange-works">
                <h2
                  id="how-the-exchange-works"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  How the listening exchange works
                </h2>
                <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                  {exchangeSteps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-strong bg-lime font-mono text-sm font-black text-on-accent shadow-raised">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm font-bold leading-6 text-ink sm:text-base">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>

                <p className="mt-6 rounded-control border-l-4 border-lime bg-lime/10 px-5 py-4 text-lg font-black leading-7 text-ink">
                  The more tracks you listen to, the more listens you can get
                  on your own music.
                </p>
              </section>

              <section aria-labelledby="comparison">
                <h2
                  id="comparison"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  A different job, not a replacement
                </h2>
                <p className="mt-4 leading-7 text-muted">
                  Each option can be part of the same promotion plan. The
                  difference is what you do and what you are trying to get.
                </p>

                <div className="mt-6 overflow-x-auto rounded-card border border-border bg-surface shadow-card">
                  <table className="w-full min-w-[42rem] border-collapse text-left">
                    <thead className="bg-surface-muted/60">
                      <tr>
                        <th scope="col" className="px-5 py-4 text-sm font-black text-ink">
                          Method
                        </th>
                        <th scope="col" className="px-5 py-4 text-sm font-black text-ink">
                          What you do
                        </th>
                        <th scope="col" className="px-5 py-4 text-sm font-black text-ink">
                          What you get
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.method}
                          className={
                            row.method === "ListenExchange"
                              ? "bg-lime/5"
                              : undefined
                          }
                        >
                          <th scope="row" className="px-5 py-4 font-black text-ink">
                            {row.method}
                          </th>
                          <td className="px-5 py-4 text-sm leading-6 text-muted">
                            {row.action}
                          </td>
                          <td className="px-5 py-4 text-sm leading-6 text-muted">
                            {row.result}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                aria-labelledby="press-play"
                className="rounded-card border border-coral/70 bg-surface p-6 shadow-card sm:p-8"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-coral-strong">
                  The problem I wanted to solve
                </p>
                <h2
                  id="press-play"
                  className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.03em] text-ink sm:text-4xl"
                >
                  How do I actually get someone to press play on my Spotify
                  track?
                </h2>
                <p className="mt-5 max-w-3xl leading-7 text-muted">
                  Start by sharing your track with artists who understand how
                  hard it is to find a real listener. You can also browse the{" "}
                  <Link
                    href="/music-blog"
                    className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4 hover:decoration-coral"
                  >
                    Music Blog
                  </Link>{" "}
                  or see the exchange in action on the{" "}
                  <Link
                    href="/discover"
                    className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4 hover:decoration-coral"
                  >
                    Discover page
                  </Link>
                  .
                </p>
                <Link
                  href="/submit"
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-strong bg-lime px-6 font-black text-on-accent shadow-raised transition hover:-translate-y-0.5 hover:bg-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Icon name="spotify" className="size-5" />
                  Submit your Spotify track
                  <Icon name="arrow-right" className="size-5" />
                </Link>
                <p className="mt-8 font-marker text-2xl text-ink sm:text-3xl">
                  Listen to artists. Get listened to.
                </p>
              </section>
            </div>

            <aside className="lg:sticky lg:top-6" aria-label="Article shortcuts">
              <Surface className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-strong">
                  Try the exchange
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Add a Spotify track, listen to other artists and use the
                  credits you earn on your own music.
                </p>
                <Link
                  href="/submit"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-lime px-4 text-sm font-black text-on-accent shadow-raised transition hover:-translate-y-0.5 hover:bg-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
                >
                  Submit a track
                  <Icon name="arrow-right" className="size-4" />
                </Link>
                <Link
                  href="/#how-it-works"
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-bold text-muted transition hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                >
                  See how it works
                </Link>
              </Surface>
            </aside>
          </div>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}
