"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { TrackCard } from "@/app/components/TrackCard";
import { Track } from "@/app/types/spotify";

// Mock data for MVP - Store only track IDs, reconstruct everything else dynamically
const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    title: "Blinding Lights - The Weeknd",
    coverUrl:
      "https://i.scdn.co/image/ab67616d0000b273bbd45c8d36e0e045ef640411",
    trackId: "2lTm559tuIvatlT1u0JYG2",
  },
  {
    id: "2",
    title: "As It Was - Harry Styles",
    coverUrl:
      "https://i.scdn.co/image/ab67616d0000b273bbd45c8d36e0e045ef640411",
    trackId: "30FURVTCpbKyykjSEQzGkH",
  },
  {
    id: "3",
    title: "Heat Waves - Glass Animals",
    coverUrl:
      "https://i.scdn.co/image/ab67616d0000b273bbd45c8d36e0e045ef640411",
    trackId: "6amDI9Dbi93HDAAYiIARjL",
  },
];

export default function DiscoverPage() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useState<
    Array<{ trackId: string; feedback: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTrack = MOCK_TRACKS[currentTrackIndex];

  const handleFeedbackSubmit = async (feedback: string) => {
    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save feedback (in-memory for MVP)
    setFeedbackHistory([
      ...feedbackHistory,
      {
        trackId: currentTrack.id,
        feedback,
      },
    ]);

    // Move to next track
    if (currentTrackIndex < MOCK_TRACKS.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      alert(
        `Great! You've listened to all ${MOCK_TRACKS.length} tracks and submitted ${feedbackHistory.length + 1} feedbacks. You earned ${feedbackHistory.length + 1} credits!`,
      );
      setCurrentTrackIndex(0);
      setFeedbackHistory([]);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 sticky top-0 z-10 bg-gray-900/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold hover:opacity-80">
            ListenExchange
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <Link href="/discover" className="text-green-400 font-semibold">
                Discover
              </Link>
              <Link
                href="/submit"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Submit
              </Link>
            </nav>
            {/* Credits Counter */}
            <div className="bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
              <p className="text-sm font-medium">
                🌟 {feedbackHistory.length} credits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Discover & Listen</h1>
              <p className="text-gray-400 mt-2">
                Track {currentTrackIndex + 1} of {MOCK_TRACKS.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Feedbacks submitted</p>
              <p className="text-2xl font-bold">{feedbackHistory.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${((currentTrackIndex + 1) / MOCK_TRACKS.length) * 100}%`,
              }}
            />
          </div>

          {/* Track Card */}
          <div className="flex justify-center">
            <TrackCard
              track={currentTrack}
              onFeedbackSubmit={handleFeedbackSubmit}
              isSubmitting={isSubmitting}
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
                  Math.min(MOCK_TRACKS.length - 1, currentTrackIndex + 1),
                )
              }
              disabled={currentTrackIndex === MOCK_TRACKS.length - 1}
              variant="secondary"
            >
              Next →
            </Button>
          </div>

          {/* Feedback History */}
          {feedbackHistory.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                Your Feedback History ({feedbackHistory.length})
              </h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {feedbackHistory.map((item, idx) => {
                  const track = MOCK_TRACKS.find((t) => t.id === item.trackId);
                  return (
                    <div
                      key={idx}
                      className="bg-gray-700 rounded p-3 text-sm border-l-2 border-green-500"
                    >
                      <p className="font-medium text-gray-100">
                        {track?.title}
                      </p>
                      <p className="text-gray-300 mt-1 line-clamp-2">
                        {item.feedback}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        ✓ +1 credit earned
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
              <li>Listen to the track for 60 seconds of real play time</li>
              <li>Share honest feedback (minimum 120 characters)</li>
              <li>Earn 1 credit per submission</li>
              <li>Use credits to submit your own tracks</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
