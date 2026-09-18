"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toggleMusicBlogLike } from "@/app/actions/music-blog";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";
import { Badge, Icon, Surface } from "@/app/components/ui/design-system";
import { MUSIC_GENRES, type MusicGenre } from "@/app/types/spotify";
import type { MusicBlogTrack } from "@/app/types/music-blog";

type SortMode = "popular" | "recent";

export function MusicBlogGallery({
  initialTracks,
  initialLikedTrackIds,
}: {
  initialTracks: MusicBlogTrack[];
  initialLikedTrackIds: string[];
}) {
  const { user, isLoading } = useCurrentUser();
  const [tracks, setTracks] = useState(initialTracks);
  const [likedTrackIds, setLikedTrackIds] = useState(
    () => new Set(initialLikedTrackIds),
  );
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre | "All">("All");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const availableGenres = useMemo(
    () =>
      MUSIC_GENRES.filter((genre) =>
        tracks.some((track) => track.genres.includes(genre)),
      ),
    [tracks],
  );

  const visibleTracks = useMemo(() => {
    const filtered =
      selectedGenre === "All"
        ? tracks
        : tracks.filter((track) => track.genres.includes(selectedGenre));

    return [...filtered].sort((left, right) => {
      if (sortMode === "recent") {
        const leftDate = Date.parse(left.publishedAt ?? left.createdAt);
        const rightDate = Date.parse(right.publishedAt ?? right.createdAt);
        return rightDate - leftDate || left.displayOrder - right.displayOrder;
      }

      return (
        right.nbListens - left.nbListens ||
        right.nbLikes - left.nbLikes ||
        left.displayOrder - right.displayOrder
      );
    });
  }, [selectedGenre, sortMode, tracks]);

  const handleLike = (track: MusicBlogTrack) => {
    if (!user) {
      setMessage("Sign in to like tracks from the Music Blog.");
      return;
    }

    const wasLiked = likedTrackIds.has(track.id);
    setMessage(null);
    setPendingTrackId(track.id);
    setLikedTrackIds((current) => {
      const next = new Set(current);
      if (wasLiked) next.delete(track.id);
      else next.add(track.id);
      return next;
    });
    setTracks((current) =>
      current.map((item) =>
        item.id === track.id
          ? {
              ...item,
              nbLikes: Math.max(0, item.nbLikes + (wasLiked ? -1 : 1)),
            }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await toggleMusicBlogLike(track.id);
      if (!result.success || typeof result.liked !== "boolean") {
        setLikedTrackIds((current) => {
          const next = new Set(current);
          if (wasLiked) next.add(track.id);
          else next.delete(track.id);
          return next;
        });
        setTracks((current) =>
          current.map((item) =>
            item.id === track.id
              ? {
                  ...item,
                  nbLikes: Math.max(0, item.nbLikes + (wasLiked ? 1 : -1)),
                }
              : item,
          ),
        );
        setMessage(result.message);
      } else {
        setLikedTrackIds((current) => {
          const next = new Set(current);
          if (result.liked) next.add(track.id);
          else next.delete(track.id);
          return next;
        });
        setTracks((current) =>
          current.map((item) =>
            item.id === track.id && typeof result.nbLikes === "number"
              ? { ...item, nbLikes: result.nbLikes }
              : item,
          ),
        );
      }
      setPendingTrackId(null);
    });
  };

  return (
    <>
      <section
        aria-label="Filter and sort tracks"
        className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
            Filter by genre
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedGenre("All")}
              aria-pressed={selectedGenre === "All"}
              className={`rounded-full border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                selectedGenre === "All"
                  ? "border-coral bg-coral text-on-accent shadow-cta-glow-soft"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              All genres
            </button>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                aria-pressed={selectedGenre === genre}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                  selectedGenre === genre
                    ? "border-coral bg-coral/15 text-ink"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <label className="flex shrink-0 flex-col gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
          Sort
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
          >
            <option value="popular">Popular</option>
            <option value="recent">Most recent</option>
          </select>
        </label>
      </section>

      {message ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-control border border-blue-strong/30 bg-blue-soft/15 px-4 py-3 text-sm text-ink">
          <span>{message}</span>
          {!user && !isLoading ? (
            <Link
              href="/auth/login"
              className="shrink-0 font-black text-coral-strong hover:underline"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      ) : null}

      {visibleTracks.length ? (
        <section
          aria-label="Music Blog tracks"
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
        >
          {visibleTracks.map((track) => {
            const liked = likedTrackIds.has(track.id);
            const pending = pendingTrackId === track.id;

            return (
              <Surface
                key={track.id}
                className="group flex min-w-0 flex-col overflow-hidden p-2.5 transition duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-highlight"
              >
                <div className="overflow-hidden rounded-control border border-border bg-spotify-surface">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${track.spotifyTrackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`${track.title} by ${track.artistName} on Spotify`}
                    className="block w-full border-0"
                  />
                </div>

                <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                  {/* <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-ink" title={track.title}>
                      {track.title}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-muted" title={track.artistName}>
                      {track.artistName}
                    </p>
                  </div> */}

                  {/* <div className="mt-3 flex flex-wrap gap-1.5">
                    {track.genres.map((genre) => (
                      <Badge
                        key={genre}
                        tone="blue"
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div> */}

                  <div className="mt-auto flex items-center gap-3 pt-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-muted"
                      title="Blog listens"
                    >
                      <Icon name="play" className="size-3.5 text-coral" />
                      {track.nbListens}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLike(track)}
                      disabled={pending || isLoading}
                      aria-pressed={liked}
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:cursor-wait disabled:opacity-60 ${
                        liked
                          ? "border-coral bg-coral text-on-accent"
                          : "border-border bg-background text-muted hover:border-coral/60 hover:text-coral-strong"
                      }`}
                    >
                      <Icon
                        name="heart"
                        className={`size-3.5 ${liked ? "fill-current" : ""}`}
                      />
                      {liked ? "Liked" : "Like"}
                      <span className="font-mono font-bold">
                        {track.nbLikes}
                      </span>
                    </button>

                    <Badge
                      key={track.genres[0]}
                      tone="blue"
                      className="px-2 py-0.5 text-[10px]"
                    >
                      {track.genres[0]}
                    </Badge>

                    <a
                      href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                      aria-label={`Open ${track.title} on Spotify`}
                    >
                      <Icon name="arrow-up-right" className="size-4" />
                    </a>
                  </div>
                </div>
              </Surface>
            );
          })}
        </section>
      ) : (
        <Surface className="mt-5 grid min-h-56 place-items-center border-dashed p-6 text-center">
          <div>
            <Icon name="music" className="mx-auto size-8 text-coral" />
            <h2 className="mt-3 text-lg font-black text-ink">
              No tracks in this genre yet
            </h2>
            <p className="mt-1 text-sm text-muted">Try another filter.</p>
          </div>
        </Surface>
      )}
    </>
  );
}
