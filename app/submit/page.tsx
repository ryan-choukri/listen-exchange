"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { SpotifyOEmbedResponse } from "@/app/types/spotify";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oembedData, setOembedData] = useState<SpotifyOEmbedResponse | null>(
    null,
  );

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

  const handleAddTrack = () => {
    if (oembedData) {
      // For MVP, just show success message
      // Later: save to database and redirect
      alert("Track submitted! (MVP version - data not saved yet)");
      setUrl("");
      setOembedData(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchOembed();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold hover:opacity-80">
            ListenExchange
          </Link>
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
          </nav>
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
                    className="w-full h-full object-cover"
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

              {/* Action Button */}
              <Button onClick={handleAddTrack} size="md" className="w-full">
                Add This Track
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
