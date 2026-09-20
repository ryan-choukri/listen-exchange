"use client";

import { useEffect, useState } from "react";
import {
  deleteSubmittedTrack,
  getUserSubmittedTracks,
} from "@/app/actions/submit";
import { announceCreditsUpdated } from "@/app/lib/credits-events";
import { announceOnboardingStateChanged } from "@/app/lib/onboarding";
import type { MusicGenre } from "@/app/types/spotify";
import { CreditAllocationModal } from "./CreditAllocationModal";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  LinkButton,
  Notice,
  StatusBadge,
  Surface,
} from "@/app/components/ui/design-system";

interface SubmittedTrackFeedback {
  id: string;
  feedback: string;
  created_at: string;
}

interface SubmittedTrack {
  id: string;
  track_id: string;
  title: string;
  artist_name: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
  genres: MusicGenre[];
  feedback_count: number;
  feedbacks: SubmittedTrackFeedback[];
}

interface UserSubmittedTracksListProps {
  refreshKey?: number;
  onTrackDeleted?: () => void;
}

const feedbackAvatarTones = [
  "border-lime/35 bg-lime/10 text-lime-strong",
  "border-blue-strong/35 bg-blue-soft/15 text-blue-strong",
  "border-coral/35 bg-coral/10 text-coral-strong",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function FeedbackPanel({
  trackId,
  feedbacks,
}: {
  trackId: string;
  feedbacks: SubmittedTrackFeedback[];
}) {
  return (
    <div
      id={`feedback-panel-${trackId}`}
      className="border-t border-border bg-surface-muted/25 px-4 py-5 sm:px-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-black text-ink sm:text-base">
          <Icon name="message" className="size-5" />
          Listener feedback ({feedbacks.length})
        </h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs">
          Real feedback from real listeners
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {feedbacks.map((item, index) => (
          <article
            key={item.id}
            className="rounded-control border border-border bg-surface p-4"
          >
            <div className="flex gap-3">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full border ${feedbackAvatarTones[index % feedbackAvatarTones.length]}`}
              >
                <Icon name="music" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-bold text-ink">
                    Community listener {String(index + 1).padStart(2, "0")}
                  </p>
                  <time
                    dateTime={item.created_at}
                    className="text-xs text-muted"
                  >
                    {formatDate(item.created_at)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-all text-sm leading-6 text-muted">
                  {item.feedback}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
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
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
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
    unusedCredits: number,
  ) => {
    const creditLabel = unusedCredits === 1 ? "credit" : "credits";
    if (
      !confirm(
        `Remove "${title}"? ${unusedCredits} unused ${creditLabel} will be returned to your balance. Completed feedback will be preserved.`,
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
        setTracks((previousTracks) =>
          previousTracks.filter((track) => track.id !== id),
        );
        setExpandedTrackId((currentId) =>
          currentId === id ? null : currentId,
        );
        setDeleteSuccess(result.message);
        announceCreditsUpdated(result.creditsBalance);
        announceOnboardingStateChanged();
        onTrackDeleted?.();
      } else {
        setDeleteError(result.message);
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "An error occurred",
      );
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

  const handleAllocationSuccess = async () => {
    const userTracks = await getUserSubmittedTracks();
    setTracks(userTracks);
  };

  if (isLoading) {
    return (
      <Surface className="space-y-4 p-5 sm:p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-muted" />
        {[0, 1, 2].map((item) => (
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
        description="Submit your Spotify track and get real listens from other artists."
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
      <div className="flex items-start justify-between gap-6 border-b border-border bg-lime/35 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Your Submitted Tracks ({tracks.length})
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Tracks you&apos;ve shared with the Listen Exchange community
          </p>
        </div>
        <div className="hidden items-end gap-4 lg:flex">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
            Submit / Share / Get feedback / Grow
          </p>
          <span className="flex h-8 items-end gap-1" aria-hidden="true">
            <span className="h-2 w-1 rounded-full bg-lime-strong" />
            <span className="h-5 w-1 rounded-full bg-lime-strong" />
            <span className="h-8 w-1 rounded-full bg-lime-strong" />
          </span>
        </div>
      </div>

      {deleteError && (
        <div className="mx-4 mt-4 sm:mx-5">
          <Notice tone="danger" title="Track could not be removed">
            {deleteError}
          </Notice>
        </div>
      )}

      {deleteSuccess && (
        <div className="mx-4 mt-4 sm:mx-5">
          <Notice tone="success" title="Track removed">
            {deleteSuccess}
          </Notice>
        </div>
      )}

      <div className="space-y-3 p-3 sm:p-4">
        {tracks.map((track, trackIndex) => {
          const isExpanded = expandedTrackId === track.id;
          const feedbackLabel =
            track.feedback_count === 1 ? "feedback" : "feedbacks";

          return (
            <section
              key={track.id}
              className="overflow-hidden rounded-card border border-border bg-background/35 transition-colors hover:border-strong/65"
            >
              <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  {/* Cover images come from the submitted Spotify track. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={track.cover_url}
                    alt=""
                    className="size-14 shrink-0 rounded-control border border-border object-cover sm:size-16"
                  />

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-ink sm:text-lg">
                      {track.title}
                    </h3>
                    <p className="truncate text-xs font-medium leading-4 text-muted">
                      {track.artist_name}
                    </p>
                    <time
                      dateTime={track.created_at}
                      className="mt-1 block text-[10px] text-muted sm:text-[11px]"
                    >
                      {formatDate(track.created_at)}
                    </time>
                    <p className="mt-1 truncate text-[10px] font-semibold text-coral-strong sm:text-xs">
                      {track.genres.join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <StatusBadge
                    status={track.status === "active" ? "active" : "pending"}
                  />
                  <Badge tone="blue" className="whitespace-nowrap px-3 py-1.5">
                    {track.credits_remaining}{" "}
                    {track.credits_remaining === 1 ? "credit" : "credits"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTrackId(isExpanded ? null : track.id)
                    }
                    disabled={track.feedback_count === 0}
                    aria-expanded={isExpanded}
                    aria-controls={`feedback-panel-${track.id}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:text-muted disabled:opacity-65"
                  >
                    <Icon name="message" className="size-4" />
                    {track.feedback_count} {feedbackLabel}
                    <Icon
                      name="chevron-down"
                      className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <Button
                    onClick={() => handleAllocateClick(track)}
                    data-onboarding-target={
                      trackIndex === 0 ? "allocate-track" : undefined
                    }
                    variant="secondary"
                    size="sm"
                    icon="wallet"
                    className="min-w-28"
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
                    variant="danger-outline"
                    size="icon"
                    icon="trash"
                    className="size-9"
                  >
                    Remove {track.title}
                  </Button>
                </div>
              </div>

              {isExpanded && track.feedbacks.length > 0 && (
                <FeedbackPanel trackId={track.id} feedbacks={track.feedbacks} />
              )}
            </section>
          );
        })}
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
