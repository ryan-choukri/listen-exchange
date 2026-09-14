"use client";

import React, { useState, useEffect } from "react";

import { Button } from "./Button";
import { useSpotifyTracker } from "@/app/hooks/useSpotifyTracker";
import { Track } from "@/app/types/spotify";
import { getUserTrackFeedback } from "@/app/actions/feedback";

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

  // Check for existing feedback on mount (non-blocking)
  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        const existing = await getUserTrackFeedback(track.trackId);
        setExistingFeedback(existing?.feedback || null);
      } catch (err) {
        // Database not ready - silently fail
        console.error("Error checking feedback:", err);
        setExistingFeedback(null);
      }
    };

    checkExistingFeedback();
  }, [track.trackId]);

  const charCount = feedback.length;
  const minChars = 10;

  const hasMinChars = charCount >= minChars;

  const canSubmit =
    hasReached60Seconds &&
    hasMinChars &&
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
        // Simulate existing feedback being set
        setExistingFeedback(feedback);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Album Cover */}

      <div className="relative w-[100px] bg-gray-200 aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-[100px] h-[100px] object-cover"
        />
      </div>

      <div className="p-6">
        {/* Track Info */}

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{track.title}</h2>

        {/* Spotify Embed */}

        <div className="my-6">
          <div ref={embedContainerRef} />
        </div>

        {!ready && (
          <p className="text-sm text-gray-500 mb-4">
            Loading Spotify player...
          </p>
        )}

        {/* Listening Progress */}

        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              Listen for 60 seconds
            </h3>

            <span
              className={`text-sm font-medium ${
                hasReached60Seconds ? "text-green-600" : "text-gray-600"
              }`}
            >
              {Math.floor(listenedMs / 1000)}s / 60s
            </span>
          </div>

          {/* Progress */}

          <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hasReached60Seconds ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          <p className="text-sm text-gray-600">
            {isPlaying
              ? "▶ Playing..."
              : listenedMs > 0
                ? "⏸ Paused"
                : "Waiting to start..."}
          </p>

          {hasReached60Seconds && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Listening complete! Feedback unlocked.
            </p>
          )}
        </div>

        {/* Feedback Section */}

        <div className="space-y-3 border-t pt-6">
          {existingFeedback ? (
            // Show existing feedback
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                ✓ Feedback already submitted
              </p>
              <p className="text-sm text-blue-800 italic">{existingFeedback}</p>
              <p className="text-xs text-blue-700 mt-2">
                You can continue listening and move to the next track.
              </p>
            </div>
          ) : (
            <>
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-gray-700"
              >
                Share your feedback
              </label>

              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={!hasReached60Seconds || isSubmitting}
                placeholder={
                  hasReached60Seconds
                    ? "What do you think about this track? (minimum 10 characters)"
                    : "Listen for 60 seconds to unlock feedback"
                }
                className="w-full p-3 border border-gray-300 rounded-lg resize-none disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
              />

              <div className="flex justify-between">
                <span
                  className={
                    hasMinChars
                      ? "text-sm text-green-600"
                      : "text-sm text-gray-600"
                  }
                >
                  {charCount} / {minChars}
                </span>

                {charCount > 0 && !hasMinChars && (
                  <span className="text-sm text-orange-600">
                    {minChars - charCount} more needed
                  </span>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Feedback submitted! +1 credit earned 🎉
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}

        <div className="flex gap-3 mt-6">
          {!existingFeedback && (
            <>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1"
              >
                {isSubmitting || externalIsSubmitting
                  ? "Submitting..."
                  : "Submit Feedback"}
              </Button>

              <Button
                onClick={handleReset}
                variant="secondary"
                className="flex-1"
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
