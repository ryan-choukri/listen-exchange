"use client";

import { useEffect, useRef, useState } from "react";
import { useSpotifyTracker } from "@/app/hooks/useSpotifyTracker";
import type { Track } from "@/app/types/spotify";
import { getUserTrackFeedback } from "@/app/actions/feedback";
import { Surface } from "@/app/components/ui/design-system";
import { FeedbackForm } from "@/app/components/music/FeedbackForm";
import { SpotifyPlayer } from "@/app/components/music/SpotifyPlayer";
import { TrackHeader } from "@/app/components/music/TrackHeader";

interface TrackCardProps {
  track: Track;
  onFeedbackSubmit?: (sessionId: string, feedback: string) => Promise<{
    success: boolean;
    newCredits?: number;
    error?: string;
  }>;
  onListeningValidated?: () => void;
  isSubmitting?: boolean;
}

export function TrackCard({
  track,
  onFeedbackSubmit,
  onListeningValidated,
  isSubmitting: externalIsSubmitting = false,
}: TrackCardProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<string | null>(null);
  const validationReportedRef = useRef(false);

  const spotifyUrl = `https://open.spotify.com/track/${track.trackId}`;
  const {
    embedContainerRef,
    ready,
    isPlaying,
    listenedMs,
    requiredMs,
    progressPercent,
    isListeningComplete,
    listeningError,
    sessionId,
    resetListening,
  } = useSpotifyTracker(spotifyUrl, track.id);

  useEffect(() => {
    if (!isListeningComplete) {
      validationReportedRef.current = false;
      return;
    }

    if (!validationReportedRef.current) {
      validationReportedRef.current = true;
      onListeningValidated?.();
    }
  }, [isListeningComplete, onListeningValidated]);

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
  const canEditFeedback = listenedMs >= 1_000 || isListeningComplete;
  const canSubmit =
    isListeningComplete &&
    Boolean(sessionId) &&
    feedback.length >= minChars &&
    !existingFeedback &&
    !isSubmitting &&
    !externalIsSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !onFeedbackSubmit || !sessionId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await onFeedbackSubmit(sessionId, feedback);
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
        submitError instanceof Error
          ? submitError.message
          : "An error occurred",
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
          artistName={track.artistName}
          coverUrl={track.coverUrl}
          status={track.status}
          creditsRemaining={track.creditsRemaining}
          genres={track.genres}
        />
        <div className="mt-5">
          <SpotifyPlayer
            containerRef={embedContainerRef}
            ready={ready}
            isPlaying={isPlaying}
            listenedMs={listenedMs}
            requiredMs={requiredMs}
            progressPercent={progressPercent}
            isListeningComplete={isListeningComplete}
            listeningError={listeningError}
          />
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <FeedbackForm
            id={`feedback-${track.trackId}`}
            value={feedback}
            onChange={setFeedback}
            onSubmit={handleSubmit}
            onReset={handleReset}
            canEdit={canEditFeedback}
            unlocked={isListeningComplete}
            requiredMs={requiredMs}
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
