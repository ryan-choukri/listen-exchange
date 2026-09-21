"use client";

import { useState, useTransition } from "react";
import { createAdminTrackFeedback } from "@/app/actions/admin-feedback";
import { AdminStatusBadge, AdminTable } from "@/app/components/admin/AdminUI";
import { Button, Icon } from "@/app/components/ui/design-system";
import { formatNumber } from "@/app/lib/admin/format";
import type { AdminTrackRow } from "@/app/lib/admin/data";
import { getSpotifyEmbedUrl } from "@/app/types/spotify";

const compactDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Paris",
});

function formatCompactDate(value: string) {
  const parts = Object.fromEntries(
    compactDateFormatter
      .formatToParts(new Date(value))
      .map(({ type, value: partValue }) => [type, partValue]),
  );

  return {
    date: `${parts.day}/${parts.month}/${parts.year}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function AdminTracksTable({ tracks }: { tracks: AdminTrackRow[] }) {
  const [rows, setRows] = useState(tracks);
  const [showSpotifyEmbeds, setShowSpotifyEmbeds] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [rowError, setRowError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleEditor = (trackId: string) => {
    if (isPending) return;

    if (editingTrackId === trackId) {
      setEditingTrackId(null);
      setDraft("");
    } else {
      setEditingTrackId(trackId);
      setDraft("");
    }

    setRowError(null);
  };

  const saveFeedback = (track: AdminTrackRow) => {
    if (isPending) return;

    const feedback = draft.trim();
    if (feedback.length < 10 || feedback.length > 500) {
      setRowError({
        id: track.track_id,
        message: "Feedback must contain between 10 and 500 characters.",
      });
      return;
    }

    setPendingTrackId(track.track_id);
    setRowError(null);

    startTransition(async () => {
      const result = await createAdminTrackFeedback(track.track_id, feedback);

      if (result.success) {
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.track_id === track.track_id
              ? { ...row, feedbacks: row.feedbacks + 1 }
              : row,
          ),
        );
        setEditingTrackId(null);
        setDraft("");
      } else {
        setRowError({ id: track.track_id, message: result.message });
      }

      setPendingTrackId(null);
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="spotify"
          disabled={!rows.length}
          aria-pressed={showSpotifyEmbeds}
          onClick={() => setShowSpotifyEmbeds((visible) => !visible)}
        >
          {showSpotifyEmbeds ? "Hide Spotify embeds" : "Load Spotify embeds"}
        </Button>
      </div>

      <div className="[&_th:nth-child(3)]:whitespace-nowrap [&_th:nth-child(4)]:w-px [&_th:nth-child(5)]:w-px [&_th:nth-child(5)]:px-2 [&_th:nth-child(5)]:text-center [&_th:nth-child(6)]:w-px [&_th:nth-child(6)]:px-2">
        <AdminTable
          headers={[
            "Track",
            "Owner",
            "Added date",
            "Status",
            "Listens",
            "Feedbacks",
          ]}
          empty={!rows.length}
          minWidth="min-w-[900px]"
          compact
        >
          {rows.map((track) => {
            const added = formatCompactDate(track.added_date);
            const isEditing = editingTrackId === track.track_id;
            const isRowPending = isPending && pendingTrackId === track.track_id;

            return (
              <tr
                key={track.track_id}
                className="transition hover:bg-surface-muted/30"
              >
                <td className="w-56 max-w-55 px-3 py-3 align-top">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-control bg-coral/15 text-coral-strong">
                      <Icon name="music" className="size-4" />
                    </span>
                    <span className="min-w-0 max-w-44">
                      <span className="block truncate font-semibold text-ink">
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {track.artist_name?.trim() || "Unknown artist"}
                      </span>
                    </span>
                  </div>

                  {showSpotifyEmbeds ? (
                    <div className="mt-3 w-64 max-w-full overflow-hidden rounded-control border border-border bg-spotify-surface">
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
                <td className="w-44 max-w-44 truncate px-3 py-3 align-top text-muted">
                  {track.owner_email ?? "Unknown"}
                </td>
                <td className="w-px whitespace-nowrap px-2 py-3 text-center align-top font-mono text-[10px] leading-4 text-muted">
                  <span className="block">{added.date}</span>
                  <span className="block">{added.time}</span>
                </td>
                <td className="w-px max-w-14 whitespace-nowrap px-3 py-3 align-top">
                  <AdminStatusBadge status={track.status} />
                </td>
                <td className="w-px whitespace-nowrap px-2 py-3 text-center align-top font-mono text-ink">
                  {formatNumber(track.listens)}
                </td>
                <td className="w-px px-2 py-3 align-top">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="min-w-5 text-center font-mono text-ink">
                      {formatNumber(track.feedbacks)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEditor(track.track_id)}
                      disabled={isPending}
                    >
                      {isEditing ? "Cancel" : "Add feedback"}
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 w-64 space-y-2">
                      <textarea
                        aria-label={`Add feedback to ${track.title}`}
                        value={draft}
                        onChange={(event) => {
                          setDraft(event.target.value);
                          setRowError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            saveFeedback(track);
                          }
                        }}
                        maxLength={500}
                        rows={2}
                        autoFocus
                        disabled={isRowPending}
                        placeholder="Write feedback…"
                        className="block w-full resize-none rounded-control border border-border bg-background px-2.5 py-2 text-xs leading-4 text-ink outline-none transition placeholder:text-muted/70 focus:border-blue-strong focus:ring-2 focus:ring-blue-soft/20"
                      />
                      <div className="flex items-start justify-between gap-2">
                        {rowError?.id === track.track_id ? (
                          <p className="text-[10px] leading-4 text-danger">
                            {rowError.message}
                          </p>
                        ) : (
                          <p className="text-[10px] leading-4 text-muted">
                            Enter to save · Shift+Enter for a new line
                          </p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          icon="check"
                          onClick={() => saveFeedback(track)}
                          disabled={isPending || draft.trim().length < 10}
                          loading={isRowPending}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : rowError?.id === track.track_id ? (
                    <p className="mt-1 text-[10px] leading-4 text-danger">
                      {rowError.message}
                    </p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>
    </>
  );
}
