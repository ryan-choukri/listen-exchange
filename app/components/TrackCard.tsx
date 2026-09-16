"use client";

import { useEffect, useState } from "react";
import { useSpotifyTracker } from "@/app/hooks/useSpotifyTracker";
import type { Track } from "@/app/types/spotify";
import { getUserTrackFeedback } from "@/app/actions/feedback";
import { Surface } from "@/app/components/ui/design-system";
import { FeedbackForm } from "@/app/components/music/FeedbackForm";
import { ListeningProgress } from "@/app/components/music/ListeningProgress";
import { SpotifyPlayer } from "@/app/components/music/SpotifyPlayer";
import { TrackHeader } from "@/app/components/music/TrackHeader";

interface TrackCardProps {
  track: Track;
  onFeedbackSubmit?: (feedback: string) => Promise<{
    success: boolean;
    newCredits?: number;
    error?: string;
  }>;
  isSubmitting?: boolean;
}

export function TrackCard({
  track,
  onFeedbackSubmit,
  isSubmitting: externalIsSubmitting = false,
}: TrackCardProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<string | null>(null);

  const spotifyUrl = `https://open.spotify.com/track/${track.trackId}`;
  const {
    embedContainerRef,
    ready,
    isPlaying,
    listenedMs,
    progressPercent,
    hasReached60Seconds,
    resetListening,
  } = useSpotifyTracker(spotifyUrl);

  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        const existing = await getUserTrackFeedback(track.trackId);
        setExistingFeedback(existing?.feedback || null);
      } catch (checkError) {
        console.error("Error checking feedback:", checkError);
        setExistingFeedback(null);
      }
    };

    checkExistingFeedback();
  }, [track.trackId]);

  const minChars = 10;
  const canSubmit =
    hasReached60Seconds &&
    feedback.length >= minChars &&
    !existingFeedback &&
    !isSubmitting &&
    !externalIsSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !onFeedbackSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await onFeedbackSubmit(feedback);
      if (result.success) {
        setSuccess(true);
        setFeedback("");
        setExistingFeedback(feedback);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFeedback("");
    setError(null);
    setSuccess(false);
    resetListening();
  };

  return (
    <Surface className="w-full overflow-hidden">
      <div className="p-4 sm:p-6">
        <TrackHeader
          title={track.title}
          coverUrl={track.coverUrl}
          status={track.status}
          creditsRemaining={track.creditsRemaining}
        />
        <div className="mt-5">
          <SpotifyPlayer containerRef={embedContainerRef} ready={ready} />
        </div>
        <div className="mt-4">
          <ListeningProgress
            isPlaying={isPlaying}
            listenedMs={listenedMs}
            progressPercent={progressPercent}
            complete={hasReached60Seconds}
          />
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <FeedbackForm
            id={`feedback-${track.trackId}`}
            value={feedback}
            onChange={setFeedback}
            onSubmit={handleSubmit}
            onReset={handleReset}
            unlocked={hasReached60Seconds}
            existingFeedback={existingFeedback}
            error={error}
            success={success}
            isSubmitting={isSubmitting || externalIsSubmitting}
            canSubmit={canSubmit}
            minChars={minChars}
          />
        </div>
      </div>
    </Surface>
  );
}
