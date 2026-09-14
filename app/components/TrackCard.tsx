"use client";

import React, { useState } from "react";

import { Button } from "./Button";
import { useSpotifyTracker } from "@/app/hooks/useSpotifyTracker";
import { Track } from "@/app/types/spotify";

interface TrackCardProps {
  track: Track;
  onFeedbackSubmit?: (feedback: string) => void;
  isSubmitting?: boolean;
}

export function TrackCard({
  track,
  onFeedbackSubmit,
  isSubmitting = false,
}: TrackCardProps) {
  const [feedback, setFeedback] = useState("");

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

  const charCount = feedback.length;
  const minChars = 10;

  const hasMinChars = charCount >= minChars;

  const canSubmit = hasReached60Seconds && hasMinChars;

  const handleSubmit = () => {
    if (canSubmit && onFeedbackSubmit) {
      onFeedbackSubmit(feedback);
    }
  };

  const handleReset = () => {
    setFeedback("");
    resetListening();
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Album Cover */}

      <div className="relative w-full bg-gray-200 aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover"
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

        {/* Feedback */}

        <div className="space-y-3 border-t pt-6">
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
            disabled={!hasReached60Seconds}
            placeholder={
              hasReached60Seconds
                ? "What do you think about this track? (minimum 120 characters)"
                : "Listen for 60 seconds to unlock feedback"
            }
            className="w-full p-3 border border-gray-300 rounded-lg resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={4}
          />

          <div className="flex justify-between">
            <span
              className={
                hasMinChars ? "text-sm text-green-600" : "text-sm text-gray-600"
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
        </div>

        {/* Actions */}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>

          <Button onClick={handleReset} variant="secondary" className="flex-1">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
