"use client";

import { useState } from "react";
import { AdminStatusBadge, AdminTable } from "@/app/components/admin/AdminUI";
import { Button, Icon } from "@/app/components/ui/design-system";
import { formatDate, formatNumber } from "@/app/lib/admin/format";
import type { AdminTrackRow } from "@/app/lib/admin/data";
import { getSpotifyEmbedUrl } from "@/app/types/spotify";

export function AdminTracksTable({ tracks }: { tracks: AdminTrackRow[] }) {
  const [showSpotifyEmbeds, setShowSpotifyEmbeds] = useState(false);
  console.log(tracks);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="spotify"
          disabled={!tracks.length}
          aria-pressed={showSpotifyEmbeds}
          onClick={() => setShowSpotifyEmbeds((visible) => !visible)}
        >
          {showSpotifyEmbeds ? "Hide Spotify embeds" : "Load Spotify embeds"}
        </Button>
      </div>

      <AdminTable
        headers={[
          "Track",
          "Owner",
          "Added date",
          "Status",
          "Listens",
          "Feedbacks",
        ]}
        empty={!tracks.length}
      >
        {tracks.map((track) => (
          <tr
            key={track.track_id}
            className="transition hover:bg-surface-muted/30"
          >
            <td className="px-5 py-3.5 align-top">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-control bg-coral/15 text-coral-strong">
                  <Icon name="music" className="size-4" />
                </span>
                <span className="min-w-0 max-w-64">
                  <span className="block truncate font-semibold text-ink">
                    {track.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {track.artist_name?.trim() || "Unknown artist"}
                  </span>
                </span>
              </div>

              {showSpotifyEmbeds ? (
                <div className="mt-3 w-80 max-w-full overflow-hidden rounded-control border border-border bg-spotify-surface">
                  <iframe
                    src={`${getSpotifyEmbedUrl(track.spotify_track_id)}&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`${track.title} by ${track.artist_name?.trim() || "Unknown artist"} on Spotify`}
                    className="block w-full border-0"
                  />
                </div>
              ) : null}
            </td>
            <td className="max-w-56 truncate px-5 py-3.5 align-top text-muted">
              {track.owner_email ?? "Unknown"}
            </td>
            <td className="whitespace-nowrap px-5 py-3.5 align-top text-muted">
              {formatDate(track.added_date)}
            </td>
            <td className="px-5 py-3.5 align-top">
              <AdminStatusBadge status={track.status} />
            </td>
            <td className="px-5 py-3.5 align-top font-mono text-ink">
              {formatNumber(track.listens)}
            </td>
            <td className="px-5 py-3.5 align-top font-mono text-ink">
              {formatNumber(track.feedbacks)}
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
