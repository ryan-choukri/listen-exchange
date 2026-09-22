"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/components/Button";
import { TrackCard } from "@/app/components/TrackCard";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import {
  EmptyState,
  LinkButton,
  Notice,
  Surface,
} from "@/app/components/ui/design-system";
import { Track, TrackFeedback } from "@/app/types/spotify";
import { submitTrackFeedback, getUserFeedbacks } from "@/app/actions/feedback";
import {
  getSubmittedTracks,
  type DiscoverCursor,
  type DiscoverTrack,
} from "@/app/actions/submit";
import { announceCreditsUpdated } from "@/app/lib/credits-events";

const PREFETCH_THRESHOLD = 5;

function FeedbackRewardCard({ feedbackCount }: { feedbackCount: number }) {
  const nextRewardAt = (Math.floor(feedbackCount / 10) + 1) * 10;
  const currentMilestoneStart = nextRewardAt - 10;
  const currentMilestoneProgress = feedbackCount - currentMilestoneStart;
  const feedbacksRemaining = nextRewardAt - feedbackCount;
  const progress = (currentMilestoneProgress / 10) * 100;

  return (
    <Surface className="relative w-full overflow-hidden border-coral/45 px-3.5 py-3 shadow-card sm:w-64 sm:px-4 lg:w-[17rem]">
      <div className="pointer-events-none absolute inset-0 bg-coral/10" />
      <div className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-full border border-coral-strong bg-coral text-lg text-on-accent shadow-raised sm:size-11 sm:text-xl"
        >
          ★
        </span>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-coral-strong">
            Next reward
          </p>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-ink">
            {feedbackCount} / {nextRewardAt}
          </p>
          <div
            aria-label={`${currentMilestoneProgress} of 10 feedbacks in the current reward milestone`}
            aria-valuemax={10}
            aria-valuemin={0}
            aria-valuenow={currentMilestoneProgress}
            className="mt-2 h-2 overflow-hidden rounded-full bg-background/70 ring-1 ring-border"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-coral transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-4 text-muted">
        {feedbacksRemaining} more feedback
        {feedbacksRemaining === 1 ? "" : "s"} to unlock a bonus gift 🎁
      </p>
    </Surface>
  );
}

function DiscoverNextButton({
  cooldownSeconds,
  atEnd,
  loading,
  onNext,
}: {
  cooldownSeconds: number;
  atEnd: boolean;
  loading: boolean;
  onNext: (bypassCooldown: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const bypassCooldown =
    searchParams.has("you") ||
    Array.from(searchParams.values()).some(
      (value) => value.toLowerCase() === "you",
    );

  return (
    <Button
      onClick={() => onNext(bypassCooldown)}
      disabled={(!bypassCooldown && cooldownSeconds > 0) || atEnd}
      loading={!bypassCooldown && cooldownSeconds === 0 && loading && atEnd}
      variant="secondary"
      icon="arrow-right"
    >
      {!bypassCooldown && cooldownSeconds > 0
        ? `Next (${cooldownSeconds}s)`
        : "Next"}
    </Button>
  );
}

function toTrack(track: DiscoverTrack): Track {
  return {
    id: track.id,
    title: track.title,
    artistName: track.artist_name,
    coverUrl: track.cover_url,
    trackId: track.track_id,
    creditsRemaining: track.credits_remaining,
    status: track.status,
    genres: track.genres,
  };
}

export default function DiscoverPage() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState<TrackFeedback[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<DiscoverCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCooldownSeconds, setNextCooldownSeconds] = useState(0);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const initialLoadStartedRef = useRef(false);
  const prefetchingRef = useRef(false);
  const tracksRef = useRef<Track[]>([]);
  const consecutiveNextClicksRef = useRef(0);

  // Load feedbacks on mount
  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        const userFeedbacks = await getUserFeedbacks();
        setFeedbacks(userFeedbacks || []);
      } catch (err) {
        // Database not ready - silently fail and continue
        console.error("Error loading user feedbacks:", err);
        setFeedbacks([]);
      }
    };

    loadFeedbacks();
  }, []);

  // Load submitted tracks from Supabase
  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;

    const loadTracks = async () => {
      try {
        setIsLoadingTracks(true);
        setTracksError(null);
        const page = await getSubmittedTracks();
        const initialTracks = page.tracks.map(toTrack);

        tracksRef.current = initialTracks;
        setTracks(initialTracks);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (err) {
        console.error("Error loading tracks:", err);
        setTracksError("Failed to load tracks. Please refresh the page.");
        tracksRef.current = [];
        setTracks([]);
        setNextCursor(null);
        setHasMore(false);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    loadTracks();
  }, []);

  useEffect(() => {
    const remainingTracks = tracks.length - currentTrackIndex - 1;

    if (
      isLoadingTracks ||
      remainingTracks > PREFETCH_THRESHOLD ||
      !hasMore ||
      !nextCursor ||
      prefetchingRef.current
    ) {
      return;
    }

    prefetchingRef.current = true;
    setIsLoadingMore(true);

    const preloadNextBatch = async () => {
      try {
        const page = await getSubmittedTracks(nextCursor);

        setTracks((previousTracks) => {
          const loadedIds = new Set(previousTracks.map((track) => track.id));
          const newTracks = page.tracks
            .filter((track) => !loadedIds.has(track.id))
            .map(toTrack);
          const updatedTracks = [...previousTracks, ...newTracks];

          tracksRef.current = updatedTracks;
          return updatedTracks;
        });
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (err) {
        console.error("Error preloading tracks:", err);
        setTracksError("More tracks could not be loaded. Please try again.");
        setHasMore(false);
      } finally {
        prefetchingRef.current = false;
        setIsLoadingMore(false);
      }
    };

    preloadNextBatch();
  }, [currentTrackIndex, hasMore, isLoadingTracks, nextCursor, tracks.length]);

  useEffect(() => {
    if (nextCooldownSeconds <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setNextCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [nextCooldownSeconds]);

  const currentTrack = tracks[currentTrackIndex];

  const handleNext = (bypassCooldown = false) => {
    if (
      (!bypassCooldown && nextCooldownSeconds > 0) ||
      currentTrackIndex >= tracks.length - 1
    ) {
      return;
    }

    if (bypassCooldown) {
      consecutiveNextClicksRef.current = 0;
      setNextCooldownSeconds(0);
      setCurrentTrackIndex((index) => Math.min(tracks.length - 1, index + 1));
      return;
    }

    const nextClickCount = consecutiveNextClicksRef.current + 1;
    consecutiveNextClicksRef.current = nextClickCount;
    setCurrentTrackIndex((index) => Math.min(tracks.length - 1, index + 1));

    setNextCooldownSeconds(nextClickCount >= 10 ? 15 : 5);
  };

  const handleListeningValidated = () => {
    consecutiveNextClicksRef.current = 0;
    setNextCooldownSeconds(0);
  };

  const handleFeedbackSubmit = async (
    listeningSessionId: string,
    feedback: string,
  ) => {
    try {
      const result = await submitTrackFeedback(listeningSessionId, feedback);

      if (result.success) {
        announceCreditsUpdated(result.new_credits ?? undefined);

        if (currentTrack) {
          const remainingTracks = tracksRef.current.filter(
            (track) => track.trackId !== currentTrack.trackId,
          );

          tracksRef.current = remainingTracks;
          setTracks(remainingTracks);
          setCurrentTrackIndex((index) =>
            Math.min(index, Math.max(0, remainingTracks.length - 1)),
          );
        }

        // Refresh feedbacks
        try {
          const updatedFeedbacks = await getUserFeedbacks();
          setFeedbacks(updatedFeedbacks || []);
        } catch (err) {
          console.error("Error refreshing feedbacks:", err);
        }

        return {
          success: true,
          newCredits: result.new_credits ?? undefined,
          creditsAwarded: result.credits_awarded ?? undefined,
        };
      } else {
        return {
          success: false,
          error: result.message,
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  };

  return (
    <AppShell width="medium">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Community listening"
          title="Discover & Listen"
          description="Give independent artists your full attention, share thoughtful feedback, and earn credits for your own releases."
          aside={<FeedbackRewardCard feedbackCount={feedbacks.length} />}
        />

        {tracksError && (
          <Notice tone="danger" title="Tracks could not be loaded">
            {tracksError}
          </Notice>
        )}

        {isLoadingTracks || (tracks.length === 0 && hasMore) ? (
          <Surface className="grid min-h-72 place-items-center border-dashed p-6">
            <div className="text-center text-muted">
              <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-border border-r-coral" />
              <p className="text-sm font-semibold">Loading tracks...</p>
            </div>
          </Surface>
        ) : tracks.length === 0 ? (
          <EmptyState
            icon="headphones"
            title="No tracks available yet"
            description="Be the first to add an independent track to the listening queue."
            action={
              <LinkButton href="/submit" icon="upload">
                Submit a track
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-8">
            <TrackCard
              key={currentTrack.id}
              track={currentTrack}
              onFeedbackSubmit={handleFeedbackSubmit}
              onListeningValidated={handleListeningValidated}
            />

            <div className="flex justify-center gap-3">
              <Button
                onClick={() =>
                  setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))
                }
                disabled={currentTrackIndex === 0}
                variant="outline"
                icon="arrow-left"
              >
                Previous
              </Button>
              <Suspense
                fallback={
                  <Button
                    disabled={
                      nextCooldownSeconds > 0 ||
                      currentTrackIndex === tracks.length - 1
                    }
                    variant="secondary"
                    icon="arrow-right"
                  >
                    {nextCooldownSeconds > 0
                      ? `Next (${nextCooldownSeconds}s)`
                      : "Next"}
                  </Button>
                }
              >
                <DiscoverNextButton
                  cooldownSeconds={nextCooldownSeconds}
                  atEnd={currentTrackIndex === tracks.length - 1}
                  loading={isLoadingMore}
                  onNext={handleNext}
                />
              </Suspense>
            </div>

            {feedbacks.length > 0 && (
              <Surface className="p-5 sm:p-6">
                <h2 className="text-lg font-black text-ink">
                  Your Feedback History ({feedbacks.length})
                </h2>
                <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
                  {feedbacks.map((item, idx) => {
                    const track = tracks.find(
                      (t) => t.trackId === item.track_id,
                    );
                    return (
                      <div
                        key={idx}
                        className="rounded-control border border-border border-l-4 border-l-lime-strong bg-background p-3 text-sm"
                      >
                        <p className="font-bold text-ink">
                          {track?.title || "One track of the community"}
                        </p>
                        {track ? (
                          <p className="text-xs text-muted">
                            {track.artistName}
                          </p>
                        ) : null}
                        <p className="mt-1 line-clamp-2 text-muted">
                          {item.feedback}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-success">
                          ✓ +1 credit earned •{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Surface>
            )}

            <Notice tone="info" title="How it works">
              <ol className="ml-4 list-decimal space-y-1">
                <li>Complete the server-verified listening timer</li>
                <li>Share honest feedback (minimum 10 characters)</li>
                <li>Earn 1 credit per submission</li>
                <li>Use credits to support your own tracks</li>
              </ol>
            </Notice>
          </div>
        )}
      </div>
    </AppShell>
  );
}
