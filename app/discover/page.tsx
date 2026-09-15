"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { TrackCard } from "@/app/components/TrackCard";
import { Navbar } from "@/app/components/Navbar";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Error State */}
        {tracksError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{tracksError}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingTracks ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-400">Loading tracks...</p>
            </div>
          </div>
        ) : tracks.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No tracks available yet
            </p>
            <p className="text-gray-500 mb-6">
              Be the first to{" "}
              <Link
                href="/submit"
                className="text-green-400 hover:text-green-300"
              >
                submit a track
              </Link>
              !
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Discover & Listen</h1>
                <p className="text-gray-400 mt-2">
                  Track {currentTrackIndex + 1} of {tracks.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Feedbacks submitted</p>
                <p className="text-2xl font-bold">{feedbacks.length}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${((currentTrackIndex + 1) / tracks.length) * 100}%`,
                }}
              />
            </div>

            {/* Track Card */}
            <div className="flex justify-center">
              <TrackCard
                track={currentTrack}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
            </div>

            {/* Navigation */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() =>
                  setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))
                }
                disabled={currentTrackIndex === 0}
                variant="secondary"
              >
                ← Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentTrackIndex(
                    Math.min(tracks.length - 1, currentTrackIndex + 1),
                  )
                }
                disabled={currentTrackIndex === tracks.length - 1}
                variant="secondary"
              >
                Next →
              </Button>
            </div>

            {/* Feedback History */}
            {feedbacks.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Your Feedback History ({feedbacks.length})
                </h2>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {feedbacks.map((item, idx) => {
                    const track = tracks.find(
                      (t) => t.trackId === item.track_id,
                    );
                    return (
                      <div
                        key={idx}
                        className="bg-gray-700 rounded p-3 text-sm border-l-2 border-green-500"
                      >
                        <p className="font-medium text-gray-100">
                          {track?.title || item.track_id}
                        </p>
                        <p className="text-gray-300 mt-1 line-clamp-2">
                          {item.feedback}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          ✓ +1 credit earned •{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">ℹ️ How it works:</span>
              </p>
              <ol className="text-sm text-blue-300/80 space-y-1 ml-4 list-decimal">
                <li>Listen to the track for 10 seconds of real play time</li>
                <li>Share honest feedback (minimum 10 characters)</li>
                <li>Earn 1 credit per submission</li>
                <li>Use credits to submit your own tracks</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
