"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/Button";
import { TrackCard } from "@/app/components/TrackCard";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import {
  EmptyState,
  LinkButton,
  Notice,
  ProgressBar,
  Surface,
} from "@/app/components/ui/design-system";
import { Track, TrackFeedback } from "@/app/types/spotify";
import { submitTrackFeedback, getUserFeedbacks } from "@/app/actions/feedback";
import { getSubmittedTracks } from "@/app/actions/submit";

export default function DiscoverPage() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState<TrackFeedback[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [tracksError, setTracksError] = useState<string | null>(null);

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
    const loadTracks = async () => {
      try {
        setIsLoadingTracks(true);
        setTracksError(null);
        const submittedTracks = await getSubmittedTracks();

        if (submittedTracks.length === 0) {
          setTracks([]);
          setTracksError(null);
        } else {
          // Convert Supabase format to Track format
          const convertedTracks: Track[] = submittedTracks.map((track) => ({
            id: track.id,
            title: track.title,
            coverUrl: track.cover_url,
            trackId: track.track_id,
            creditsRemaining: track.credits_remaining,
            status: track.status,
          }));
          setTracks(convertedTracks);
        }
      } catch (err) {
        console.error("Error loading tracks:", err);
        setTracksError("Failed to load tracks. Please refresh the page.");
        setTracks([]);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    loadTracks();
  }, []);

  const currentTrack = tracks[currentTrackIndex];

  const handleFeedbackSubmit = async (feedback: string) => {
    try {
      const result = await submitTrackFeedback(currentTrack.trackId, feedback);

      if (result.success) {
        // Refresh feedbacks
        try {
          const updatedFeedbacks = await getUserFeedbacks();
          setFeedbacks(updatedFeedbacks || []);
        } catch (err) {
          console.error("Error refreshing feedbacks:", err);
        }

        return {
          success: true,
          newCredits: result.new_credits || 0,
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
          aside={
            <Surface className="min-w-40 px-4 py-3 text-right shadow-none">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Feedbacks submitted
              </p>
              <p className="mt-1 text-2xl font-black text-ink">
                {feedbacks.length}
              </p>
            </Surface>
          }
        />

        {tracksError && (
          <Notice tone="danger" title="Tracks could not be loaded">
            {tracksError}
          </Notice>
        )}

        {isLoadingTracks ? (
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
            <ProgressBar
              value={((currentTrackIndex + 1) / tracks.length) * 100}
              label={`Track ${currentTrackIndex + 1} of ${tracks.length}`}
              detail={`${Math.round(((currentTrackIndex + 1) / tracks.length) * 100)}%`}
              tone="coral"
            />

            <TrackCard
              track={currentTrack}
              onFeedbackSubmit={handleFeedbackSubmit}
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
              <Button
                onClick={() =>
                  setCurrentTrackIndex(
                    Math.min(tracks.length - 1, currentTrackIndex + 1),
                  )
                }
                disabled={currentTrackIndex === tracks.length - 1}
                variant="secondary"
                icon="arrow-right"
              >
                Next
              </Button>
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
                          {track?.title || item.track_id}
                        </p>
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
                <li>Listen to the track for 10 seconds of real play time</li>
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
