import Link from "next/link";
import { Icon } from "@/app/components/ui/design-system";
import { PublicHeader } from "@/app/music-blog/MusicBlogHeader";
import type { SeoArticle } from "@/app/lib/seo-articles";

const exchangeSteps = [
  "Listen to tracks from other independent artists.",
  "Earn credits for your listening time.",
  "Use those credits on your own Spotify track.",
  "Other artists listen to your track in return.",
] as const;

export function SeoArticlePage({ article }: { article: SeoArticle }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    mainEntityOfPage: `https://listen-exchange.com/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "ListenExchange",
      url: "https://listen-exchange.com",
    },
  };

  return (
    <div className="paper-canvas min-h-screen bg-background text-ink">
      <PublicHeader activeHref={null} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <article>
          <header className="border-b border-border pb-9 sm:pb-12">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-coral-strong">
              Spotify promotion for independent artists
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-semibold leading-8 text-ink sm:text-xl sm:leading-9">
              {article.intro}
            </p>
          </header>

          <div className="mx-auto mt-10 max-w-3xl space-y-11">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-black tracking-[-0.025em] text-ink sm:text-3xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-muted sm:text-lg">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 rounded-control border border-border bg-surface px-4 py-3 leading-7 text-muted"
                      >
                        <Icon
                          name="check"
                          className="mt-1 size-4 shrink-0 text-lime-strong"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.quote ? (
                  <blockquote className="mt-5 rounded-card border border-coral/60 bg-coral/10 px-5 py-5 text-xl font-black leading-8 text-ink shadow-card sm:px-7 sm:text-2xl">
                    {section.quote}
                  </blockquote>
                ) : null}
              </section>
            ))}

            <section aria-labelledby={`${article.slug}-exchange`}>
              <h2
                id={`${article.slug}-exchange`}
                className="text-2xl font-black tracking-[-0.025em] text-ink sm:text-3xl"
              >
                How ListenExchange works
              </h2>
              <p className="mt-4 text-base leading-8 text-muted sm:text-lg">
                ListenExchange is an artist-to-artist listening exchange. It
                does not promise playlist placement or guaranteed results. It
                gives independent artists a simple way to trade listening time.
              </p>
              <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                {exchangeSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-strong bg-lime font-mono text-sm font-black text-on-accent shadow-raised">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm font-bold leading-6 text-ink">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-control border-l-4 border-lime bg-lime/10 px-5 py-4 font-black leading-7 text-ink">
                The more tracks you listen to, the more listens you can get on
                your own music.
              </p>
            </section>

            <section className="rounded-card border border-coral/70 bg-surface p-6 shadow-card sm:p-8">
              <h2 className="text-2xl font-black tracking-[-0.025em] text-ink sm:text-3xl">
                Put your track in front of other artists
              </h2>
              <p className="mt-4 leading-7 text-muted">
                Read the story behind the{" "}
                <Link
                  href="/spotify-listening-exchange"
                  className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4"
                >
                  Spotify listening exchange
                </Link>
                , browse tracks on{" "}
                <Link
                  href="/discover"
                  className="font-bold text-coral-strong underline decoration-coral/40 underline-offset-4"
                >
                  Discover
                </Link>
                , or add your own release when you are ready.
              </p>
              <Link
                href="/submit"
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-strong bg-lime px-6 font-black text-on-accent shadow-raised transition hover:-translate-y-0.5 hover:bg-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
              >
                <Icon name="spotify" className="size-5" />
                Submit your Spotify track
                <Icon name="arrow-right" className="size-5" />
              </Link>
              <p className="mt-7 font-marker text-2xl text-ink sm:text-3xl">
                Listen to artists. Get listened to.
              </p>
            </section>
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
