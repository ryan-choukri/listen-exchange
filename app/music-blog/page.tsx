import type { Metadata } from "next";
import Link from "next/link";
import { MusicBlogGallery } from "@/app/music-blog/MusicBlogGallery";
import { MusicBlogHeader } from "@/app/music-blog/MusicBlogHeader";
import { getPublicMusicBlogData } from "@/app/lib/music-blog";
import { Icon } from "@/app/components/ui/design-system";

export const metadata: Metadata = {
  title: "Music Blog | Listen Exchange",
  description:
    "Fresh independent music selected by Listen Exchange. Listen, support and discover real artists.",
};

export default async function MusicBlogPage() {
  const { tracks, likedTrackIds } = await getPublicMusicBlogData();

  return (
    <div className="paper-canvas min-h-screen bg-background text-ink">
      <MusicBlogHeader />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="relative border-b border-border pb-8">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-coral-strong">
              Music Blog
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">
              New music. <span className="text-coral">Real artists.</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
              A selection of tracks we like. Independent artists, fresh sounds,
              all genres. Listen, support, and discover what&apos;s next.
            </p>
          </div>

          <aside className="paper-note mt-7 w-fit rotate-[-3deg] rounded-control bg-coral px-5 py-4 text-on-accent sm:absolute sm:right-4 sm:top-1 sm:mt-0">
            <p className="font-marker text-lg leading-6 sm:text-xl">
              Support
              <br />
              independent music ♡
            </p>
          </aside>
        </section>

        <MusicBlogGallery
          initialTracks={tracks}
          initialLikedTrackIds={likedTrackIds}
        />

        <section className="relative mt-10 overflow-hidden rounded-card border border-coral/70 bg-surface px-5 py-6 shadow-card sm:px-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,var(--coral)_1px,transparent_1.5px)] bg-[length:12px_12px] opacity-15" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-coral-strong">
                Want to be heard?
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">
                Submit your track
              </h2>
              <p className="mt-1 text-sm text-muted">
                Share your music with the Listen Exchange community.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-strong bg-coral px-5 font-black text-on-accent shadow-raised transition hover:-translate-y-0.5 hover:bg-coral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
            >
              Submit a track
              <Icon name="arrow-right" className="size-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
