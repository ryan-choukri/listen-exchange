"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { LogoutButton } from "@/app/components/LogoutButton";
import { SpotifyOEmbedResponse } from "@/app/types/spotify";
import { submitTrack } from "@/app/actions/submit";
import { UserTracksStats } from "@/app/components/UserTracksStats";
import { UserSubmittedTracksList } from "@/app/components/UserSubmittedTracksList";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oembedData, setOembedData] = useState<SpotifyOEmbedResponse | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const validateUrl = (urlStr: string): boolean => {
    try {
      const urlObj = new URL(urlStr);
      return (
        urlObj.hostname.includes("spotify.com") &&
        urlObj.pathname.includes("/track/")
      );
    } catch {
      return false;
    }
  };

  const handleFetchOembed = async () => {
    setError("");
    setOembedData(null);

    if (!url.trim()) {
      setError("Please enter a Spotify track URL");
      return;
    }

    if (!validateUrl(url)) {
      setError(
        "Please enter a valid Spotify track URL (e.g., https://open.spotify.com/track/...)",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/oembed?url=${encodeURIComponent(url)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch track information");
      }

      const data = await response.json();
      setOembedData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch track information",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = async () => {
    if (!oembedData) return;

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const result = await submitTrack(
        url,
        oembedData.title,
        oembedData.thumbnail_url,
      );

      if (result.success) {
        setSuccess(true);
        setUrl("");
        setOembedData(null);
        // Refresh the UserTracksStats component
        setRefreshKey((prev) => prev + 1);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchOembed();
    }
  };

  const handleTrackDeleted = () => {
    // Increment refreshKey to reload both UserTracksStats and UserSubmittedTracksList
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold hover:opacity-80">
            ListenExchange
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <Link
                href="/discover"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Discover
              </Link>
              <Link href="/submit" className="text-green-400 font-semibold">
                Submit
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </nav>
            {/* Sign Out Button */}
            <LogoutButton size="sm" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Submit Your Track</h1>
            <p className="text-gray-400">
              Share an independent track for the community to discover and
              review.
            </p>
          </div>

          {/* User Stats Card */}
          {/* <UserTracksStats key={refreshKey} /> */}

          {/* User Submitted Tracks List */}
          <UserSubmittedTracksList
            key={refreshKey}
            refreshKey={refreshKey}
            onTrackDeleted={handleTrackDeleted}
          />

          {/* Success Tooltip */}
          {success && (
            <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold">Track Submitted!</p>
                <p className="text-sm text-green-100">
                  Your track has been added to the discovery queue.
                </p>
              </div>
            </div>
          )}

          {/* URL Input Section */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Paste Spotify URL</h2>
            <p className="text-sm text-gray-400">
              Find a track on Spotify and copy the share link
            </p>

            <div className="space-y-3">
              <Input
                placeholder="https://open.spotify.com/track/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                className="text-white placeholder-gray-600 border-gray-600 focus:border-green-500"
              />

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleFetchOembed}
                disabled={isLoading}
                size="md"
                className="w-full"
              >
                {isLoading ? "Loading..." : "Fetch Track Info"}
              </Button>
            </div>
          </div>

          {/* Track Preview Section */}
          {oembedData && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Preview</h2>

              {/* Cover & Title */}
              <div className="space-y-3">
                <div className="w-full bg-gray-700 aspect-square rounded-lg overflow-hidden">
                  <img
                    src={oembedData.thumbnail_url}
                    alt={oembedData.title}
                    className="w-[50px] h-[50px] object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{oembedData.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {oembedData.provider_name}
                  </p>
                </div>
              </div>

              {/* Spotify Embed */}
              <div
                className="my-4"
                dangerouslySetInnerHTML={{ __html: oembedData.html }}
              />

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg">
                  <p className="text-green-300 text-sm font-medium">
                    ✓ Track submitted successfully! It's now available in
                    Discovery.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleAddTrack}
                disabled={isSubmitting}
                size="md"
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Add This Track"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Track will be added to the discovery queue for other users to
                listen and review.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">💡 Tips:</span>
            </p>
            <ul className="text-sm text-blue-300/80 space-y-1 ml-4">
              <li>• Share original or curated independent tracks</li>
              <li>• Make sure the Spotify link is a direct track link</li>
              <li>• Tracks will appear in the discovery queue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
