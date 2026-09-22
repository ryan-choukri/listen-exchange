import type { Metadata } from "next";
import Link from "next/link";
import { Icon, Surface } from "@/app/components/ui/design-system";
import { PublicHeader } from "@/app/music-blog/MusicBlogHeader";

export const metadata: Metadata = {
  title: "I Made a Plays Exchange Platform for Musicians on Spotify",
  description:
    "A free Spotify listening exchange for independent musicians: listen to other artists, earn credits and get listens on your own track.",
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
  "Listen to a track from another artist.",
  "Earn a credit for listening.",
  "Put those credits on your own Spotify track.",
  "Your track is then shown to other artists to listen to.",
] as const;

export default function SpotifyListeningExchangePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "I made a plays exchange platform for Musicians on Spotify",
    description:
      "A free Spotify listening exchange for independent musicians: listen to other artists, earn credits and get listens on your own track.",
    mainEntityOfPage: "https://listen-exchange.com/spotify-listening-exchange",
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
                ListenExchange is a free Spotify listening exchange for
                independent musicians. You listen to other artists&apos; tracks,
                earn credits, and use them to get listens on your own song.
              </p>
              <p>
                That&apos;s basically it. Instead of sending a track somewhere
                and hoping somebody finds it, you spend a little time
                discovering other artists and they do the same for you.
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
                    I&apos;m an independent musician too, and promoting a
                    Spotify release can get repetitive very quickly. I was
                    posting on Reddit, looking for playlists, trying SubmitHub
                    and sending links around. Sometimes it worked, sometimes
                    almost nobody clicked.
                  </p>
                  <p>What I really wanted was much simpler:</p>
                  <blockquote className="rounded-card border border-coral/70 bg-coral/10 px-5 py-5 text-xl font-black leading-8 text-ink shadow-card sm:px-7 sm:text-2xl">
                    I listen to your track, you listen to mine.
                  </blockquote>
                  <p>
                    I looked for a site built around that exact idea and
                    couldn&apos;t really find one I wanted to use. So I started
                    building ListenExchange.
                  </p>
                </div>
              </section>

              <section aria-labelledby="promotion-options">
                <h2
                  id="promotion-options"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  What I was using before
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">
                      Spotify playlist curators
                    </h3>
                    <p className="mt-3 leading-7 text-muted">
                      I&apos;ve spent a lot of time looking for playlists that
                      actually fit a release, then writing pitches and waiting
                      for an answer. A placement can be useful, but most
                      submissions obviously won&apos;t turn into one.
                    </p>
                  </section>

                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">Reddit</h3>
                    <p className="mt-3 leading-7 text-muted">
                      Reddit can be great for finding people who are genuinely
                      into new music, but every community has different promo
                      rules and a post can disappear pretty fast if nobody sees
                      it at the right moment.
                    </p>
                  </section>

                  <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">SubmitHub</h3>
                    <p className="mt-3 leading-7 text-muted">
                      SubmitHub makes it much easier to send a track to
                      curators, blogs and playlists in one place. I still see it
                      as pitching though: you submit the song and somebody
                      decides whether they want to do something with it.
                    </p>
                  </section>

                  <section className="rounded-card border border-coral/70 bg-coral/5 p-5 shadow-card sm:p-6">
                    <h3 className="text-xl font-black text-ink">
                      ListenExchange
                    </h3>
                    <p className="mt-3 leading-7 text-muted">
                      ListenExchange skips the pitch. Listen to someone
                      else&apos;s track, earn a credit, then spend it on your
                      own track. Another artist gets your song in their queue.
                    </p>
                  </section>
                </div>

                <p className="mt-5 leading-7 text-muted">
                  I still use other ways to promote music. This is just the one
                  I wanted to exist when the goal is very simple: get the song
                  in front of another person who is actually going to press
                  play.
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
                  The more tracks you listen to, the more listens you can get on
                  your own music.
                </p>
              </section>

              <section aria-labelledby="comparison">
                <h2
                  id="comparison"
                  className="text-3xl font-black tracking-[-0.03em] text-ink"
                >
                  The difference in practice
                </h2>
                <p className="mt-4 leading-7 text-muted">
                  I don&apos;t really see these as competing tools. They ask you
                  to do different things, and the result you&apos;re hoping for
                  is different too.
                </p>

                <div className="mt-6 overflow-x-auto rounded-card border border-border bg-surface shadow-card">
                  <table className="w-full min-w-[42rem] border-collapse text-left">
                    <thead className="bg-surface-muted/60">
                      <tr>
                        <th
                          scope="col"
                          className="px-5 py-4 text-sm font-black text-ink"
                        >
                          Method
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-4 text-sm font-black text-ink"
                        >
                          What you do
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-4 text-sm font-black text-ink"
                        >
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
                          <th
                            scope="row"
                            className="px-5 py-4 font-black text-ink"
                          >
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
                  That was the whole reason for building this. If you have more
                  time than promo budget, you can put that time into listening
                  to other musicians and use it to get your own track heard. You
                  can also browse the{" "}
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
                <p className="mt-4 max-w-3xl leading-7 text-muted">
                  If you want a broader promotion plan, read how to{" "}
                  <Link
                    href="/how-to-get-more-spotify-streams"
                    className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4 hover:decoration-coral"
                  >
                    get more Spotify streams
                  </Link>
                  . If your budget is zero, see how the{" "}
                  <Link
                    href="/free-spotify-streams"
                    className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4 hover:decoration-coral"
                  >
                    free Spotify streams exchange
                  </Link>{" "}
                  works.
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

            <aside
              className="lg:sticky lg:top-6"
              aria-label="Article shortcuts"
            >
              <Surface className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-coral-strong">
                  Try the exchange
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Add your Spotify track, listen to a few other artists and use
                  the credits on your own release.
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
