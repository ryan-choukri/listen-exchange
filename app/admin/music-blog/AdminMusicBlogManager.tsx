"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMusicBlogTrack,
  deleteMusicBlogTrack,
  updateMusicBlogTrack,
} from "@/app/actions/music-blog";
import {
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import { GenreSelector } from "@/app/components/music/GenreSelector";
import {
  Badge,
  Button,
  Icon,
  Modal,
  Notice,
  TextField,
} from "@/app/components/ui/design-system";
import type { SpotifyOEmbedResponse } from "@/app/types/spotify";
import type { MusicGenre } from "@/app/types/spotify";
import type {
  MusicBlogMutationResponse,
  MusicBlogTrack,
  MusicBlogTrackInput,
} from "@/app/types/music-blog";

interface EditableTrack extends MusicBlogTrack {
  dirty: boolean;
}

function toInput(track: EditableTrack): MusicBlogTrackInput {
  return {
    spotifyTrackId: track.spotifyTrackId,
    title: track.title,
    artistName: track.artistName,
    coverUrl: track.coverUrl,
    genres: track.genres,
    published: track.published,
    displayOrder: track.displayOrder,
    nbListens: track.nbListens,
    nbLikes: track.nbLikes,
  };
}

export function AdminMusicBlogManager({
  initialTracks,
}: {
  initialTracks: MusicBlogTrack[];
}) {
  const router = useRouter();
  const [tracks, setTracks] = useState<EditableTrack[]>(() =>
    initialTracks.map((track) => ({ ...track, dirty: false })),
  );
  const [spotifyInput, setSpotifyInput] = useState("");
  const [metadata, setMetadata] = useState<SpotifyOEmbedResponse | null>(null);
  const [newGenres, setNewGenres] = useState<MusicGenre[]>([]);
  const [publishNewTrack, setPublishNewTrack] = useState(true);
  const [editingGenresId, setEditingGenresId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState<MusicBlogMutationResponse | null>(null);
  const [, startTransition] = useTransition();

  const editingTrack = tracks.find((track) => track.id === editingGenresId);

  const patchTrack = (trackId: string, patch: Partial<EditableTrack>) => {
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, ...patch, dirty: true } : track,
      ),
    );
  };

  const fetchMetadata = async () => {
    if (!spotifyInput.trim()) return;
    setIsFetching(true);
    setStatus(null);
    setMetadata(null);

    try {
      const response = await fetch(
        `/api/oembed?url=${encodeURIComponent(spotifyInput.trim())}`,
      );
      const data = (await response.json()) as SpotifyOEmbedResponse & {
        error?: string;
      };

      if (!response.ok || !data.trackId) {
        setStatus({
          success: false,
          message: data.error ?? "Unable to fetch Spotify metadata.",
        });
        return;
      }

      setMetadata(data);
      setNewGenres([]);
    } catch {
      setStatus({ success: false, message: "Unable to contact Spotify." });
    } finally {
      setIsFetching(false);
    }
  };

  const addTrack = () => {
    if (!metadata?.trackId || !metadata.title || !metadata.artistName) return;

    if (!newGenres.length) {
      setStatus({ success: false, message: "Choose at least one genre." });
      return;
    }

    setBusyId("new");
    setStatus(null);
    const nextOrder = tracks.length
      ? Math.max(...tracks.map((track) => track.displayOrder)) + 10
      : 10;

    startTransition(async () => {
      const result = await addMusicBlogTrack({
        spotifyTrackId: metadata.trackId!,
        title: metadata.title,
        artistName: metadata.artistName!,
        coverUrl: metadata.thumbnail_url ?? null,
        genres: newGenres,
        published: publishNewTrack,
        displayOrder: nextOrder,
        nbListens: 0,
        nbLikes: 0,
      });
      setStatus(result);
      setBusyId(null);

      if (result.success) {
        setSpotifyInput("");
        setMetadata(null);
        setNewGenres([]);
        router.refresh();
      }
    });
  };

  const saveTrack = (track: EditableTrack) => {
    setBusyId(track.id);
    setStatus(null);
    startTransition(async () => {
      const result = await updateMusicBlogTrack(track.id, toInput(track));
      setStatus(result);
      setBusyId(null);
      if (result.success) {
        setTracks((current) =>
          current.map((item) =>
            item.id === track.id ? { ...item, dirty: false } : item,
          ),
        );
        router.refresh();
      }
    });
  };

  const removeTrack = (track: EditableTrack) => {
    if (!window.confirm(`Remove “${track.title}” from the Music Blog?`)) return;

    setBusyId(track.id);
    setStatus(null);
    startTransition(async () => {
      const result = await deleteMusicBlogTrack(track.id);
      setStatus(result);
      setBusyId(null);
      if (result.success) {
        setTracks((current) => current.filter((item) => item.id !== track.id));
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-7">
      <AdminPanel title="Add a Spotify track" icon="spotify">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <TextField
                  id="music-blog-spotify-track"
                  label="Spotify ID or URL"
                  placeholder="https://open.spotify.com/track/..."
                  value={spotifyInput}
                  onChange={(event) => setSpotifyInput(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                loading={isFetching}
                disabled={!spotifyInput.trim()}
                onClick={fetchMetadata}
              >
                Fetch metadata
              </Button>
            </div>

            {metadata?.trackId ? (
              <div className="mt-5 space-y-5">
                <GenreSelector value={newGenres} onChange={setNewGenres} />
                <label className="flex items-center gap-2 text-sm font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={publishNewTrack}
                    onChange={(event) => setPublishNewTrack(event.target.checked)}
                    className="size-4 accent-[var(--coral)]"
                  />
                  Publish immediately
                </label>
                <Button
                  type="button"
                  icon="plus"
                  loading={busyId === "new"}
                  onClick={addTrack}
                >
                  Add to Music Blog
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-card border border-border bg-background/60 p-4">
            {metadata?.trackId ? (
              <div className="flex items-center gap-4">
                <span
                  className="size-20 shrink-0 rounded-control border border-border bg-cover bg-center"
                  style={{ backgroundImage: `url(${metadata.thumbnail_url})` }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate font-black text-ink">{metadata.title}</p>
                  <p className="mt-1 truncate text-sm text-muted">
                    {metadata.artistName}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted">
                    {metadata.trackId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid min-h-20 place-items-center text-center text-sm text-muted">
                Spotify metadata will appear here.
              </div>
            )}
          </div>
        </div>
      </AdminPanel>

      {status ? (
        <Notice
          tone={status.success ? "success" : "danger"}
          title={status.success ? "Saved" : "Could not save"}
        >
          {status.message}
        </Notice>
      ) : null}

      <AdminTable
        headers={["Track", "Genres", "Order", "Listens", "Likes", "Status", "Actions"]}
        minWidth="min-w-[1120px]"
        empty={!tracks.length}
      >
        {tracks.map((track) => (
          <tr key={track.id} className="align-top transition hover:bg-surface-muted/25">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="size-11 shrink-0 rounded-control border border-border bg-surface-muted bg-cover bg-center"
                  style={
                    track.coverUrl
                      ? { backgroundImage: `url(${track.coverUrl})` }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  {!track.coverUrl ? (
                    <Icon name="music" className="m-3 size-4 text-muted" />
                  ) : null}
                </span>
                <span className="min-w-0 max-w-56">
                  <span className="block truncate font-bold text-ink">{track.title}</span>
                  <span className="block truncate text-xs text-muted">{track.artistName}</span>
                  <span className="mt-1 block font-mono text-[9px] text-muted">{track.spotifyTrackId}</span>
                </span>
              </div>
            </td>
            <td className="px-5 py-4">
              <div className="flex max-w-52 flex-wrap gap-1">
                {track.genres.map((genre) => (
                  <Badge key={genre} tone="blue" className="px-2 py-0.5 text-[10px]">
                    {genre}
                  </Badge>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditingGenresId(track.id)}
                className="mt-2 text-xs font-bold text-coral-strong hover:underline"
              >
                Edit genres
              </button>
            </td>
            {(
              [
                ["displayOrder", track.displayOrder, "Order"],
                ["nbListens", track.nbListens, "Listens"],
                ["nbLikes", track.nbLikes, "Likes"],
              ] as const
            ).map(([field, value, label]) => (
              <td key={field} className="px-5 py-4">
                <label className="sr-only" htmlFor={`${field}-${track.id}`}>{label}</label>
                <input
                  id={`${field}-${track.id}`}
                  type="number"
                  min="0"
                  step="1"
                  value={value}
                  onChange={(event) =>
                    patchTrack(track.id, {
                      [field]: Math.max(0, Number.parseInt(event.target.value || "0", 10)),
                    })
                  }
                  className="w-24 rounded-control border border-border bg-background px-3 py-2 font-mono text-sm text-ink outline-none focus:border-blue-strong focus:ring-2 focus:ring-blue-soft/40"
                />
              </td>
            ))}
            <td className="px-5 py-4">
              <AdminStatusBadge status={track.published ? "published" : "unpublished"} />
              <label className="mt-2 flex items-center gap-2 text-xs font-bold text-muted">
                <input
                  type="checkbox"
                  checked={track.published}
                  onChange={(event) => patchTrack(track.id, { published: event.target.checked })}
                  className="size-4 accent-[var(--coral)]"
                />
                Published
              </label>
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!track.dirty}
                  loading={busyId === track.id}
                  onClick={() => saveTrack(track)}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger-outline"
                  disabled={busyId === track.id}
                  onClick={() => removeTrack(track)}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal
        open={Boolean(editingTrack)}
        onClose={() => setEditingGenresId(null)}
        title="Edit genres"
        description={editingTrack ? `${editingTrack.title} — ${editingTrack.artistName}` : undefined}
      >
        {editingTrack ? (
          <div className="space-y-5">
            <GenreSelector
              value={editingTrack.genres}
              onChange={(genres) => patchTrack(editingTrack.id, { genres })}
            />
            <Button type="button" className="w-full" onClick={() => setEditingGenresId(null)}>
              Done
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
