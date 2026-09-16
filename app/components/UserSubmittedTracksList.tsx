"use client";

import { useEffect, useState } from "react";
import {
  getUserSubmittedTracks,
  deleteSubmittedTrack,
} from "@/app/actions/submit";
import { announceCreditsUpdated } from "@/app/lib/credits-events";
import { CreditAllocationModal } from "./CreditAllocationModal";
import {
  Badge,
  Button,
  EmptyState,
  LinkButton,
  Notice,
  StatusBadge,
  Surface,
} from "@/app/components/ui/design-system";

interface SubmittedTrack {
  id: string;
  track_id: string;
  title: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
}

interface UserSubmittedTracksListProps {
  refreshKey?: number;
  onTrackDeleted?: () => void; // Callback after successful deletion
}

export function UserSubmittedTracksList({
  refreshKey = 0,
  onTrackDeleted,
}: UserSubmittedTracksListProps) {
  const [tracks, setTracks] = useState<SubmittedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SubmittedTrack | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadTracks = async () => {
      setIsLoading(true);
      const userTracks = await getUserSubmittedTracks();
      setTracks(userTracks);
      setIsLoading(false);
    };

    loadTracks();
  }, [refreshKey]);

  const handleDelete = async (
    id: string,
    title: string,
    unusedListens: number,
  ) => {
    const listenLabel = unusedListens === 1 ? "listen" : "listens";
    if (
      !confirm(
        `Remove "${title}"? ${unusedListens} unused ${listenLabel} will be returned to your balance. Completed listens and feedback will be preserved.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const result = await deleteSubmittedTrack(id);

      if (result.success) {
        // Remove from local state
        setTracks((prev) => prev.filter((track) => track.id !== id));
        setDeleteSuccess(result.message);
        announceCreditsUpdated(result.creditsBalance);
        // Call parent callback to refresh stats
        onTrackDeleted?.();
      } else {
        setDeleteError(result.message);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAllocateClick = (track: SubmittedTrack) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTrack(null);
  };

  const handleAllocationSuccess = () => {
    // Refresh tracks
    const loadTracks = async () => {
      const userTracks = await getUserSubmittedTracks();
      setTracks(userTracks);
    };
    loadTracks();
  };

  if (isLoading) {
    return (
      <Surface className="space-y-4 p-5 sm:p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-muted" />
        {[0, 1].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 border-t border-border pt-4"
          >
            <div className="size-12 animate-pulse rounded-control bg-surface-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
            </div>
          </div>
        ))}
      </Surface>
    );
  }

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon="upload"
        title="No tracks submitted yet"
        description="Submit your first track to start collecting feedback from the community."
        className="min-h-56"
        action={
          <LinkButton href="/submit" size="sm" icon="upload">
            Submit a track
          </LinkButton>
        }
      />
    );
  }

  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-border bg-surface-muted/55 px-5 py-4 sm:px-6">
        <h3 className="text-lg font-black text-ink">
          Your Submitted Tracks ({tracks.length})
        </h3>
      </div>

      {deleteError && (
        <div className="mx-5 mt-4 sm:mx-6">
          <Notice tone="danger" title="Track could not be removed">
            {deleteError}
          </Notice>
        </div>
      )}

      {deleteSuccess && (
        <div className="mx-5 mt-4 sm:mx-6">
          <Notice tone="success" title="Track removed">
            {deleteSuccess}
          </Notice>
        </div>
      )}

      <div className="divide-y divide-border">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex flex-col items-stretch gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/35 sm:flex-row sm:items-center sm:px-6"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {/* Cover images come from the submitted Spotify track. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.cover_url}
                alt={track.title}
                className="size-12 shrink-0 rounded-control border border-border object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{track.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(track.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <StatusBadge
                status={track.status === "active" ? "active" : "pending"}
              />
              <Badge tone="blue" className="whitespace-nowrap">
                {track.credits_remaining}{" "}
                {track.credits_remaining === 1 ? "listen" : "listens"}
              </Badge>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAllocateClick(track)}
                  variant="secondary"
                  size="sm"
                  icon="wallet"
                >
                  Allocate
                </Button>
                <Button
                  onClick={() =>
                    handleDelete(
                      track.id,
                      track.title,
                      track.credits_remaining,
                    )
                  }
                  loading={deletingId === track.id}
                  variant="danger"
                  size="sm"
                  icon="close"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTrack && (
        <CreditAllocationModal
          trackId={selectedTrack.id}
          trackTitle={selectedTrack.title}
          currentCredits={selectedTrack.credits_remaining}
          currentStatus={selectedTrack.status}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleAllocationSuccess}
        />
      )}
    </Surface>
  );
}
