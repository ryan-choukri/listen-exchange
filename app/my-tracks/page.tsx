"use client";

import { useState } from "react";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { Icon, Notice, Surface } from "@/app/components/ui/design-system";
import {
  SpotifyOEmbedResponse,
  type MusicGenre,
} from "@/app/types/spotify";
import { submitTrack } from "@/app/actions/submit";
import { UserSubmittedTracksList } from "@/app/components/UserSubmittedTracksList";
import { GenreSelector } from "@/app/components/music/GenreSelector";

export default function MyTracksPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oembedData, setOembedData] = useState<SpotifyOEmbedResponse | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);

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
    setSelectedGenres([]);

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

    const previewUrl = oembedData.spotifyUrl;

    if (!previewUrl) {
      setError("The loaded track preview is missing its Spotify URL");
      return;
    }

    if (selectedGenres.length === 0) {
      setError("Select at least one genre");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const result = await submitTrack(
        previewUrl,
        oembedData.title,
        oembedData.artistName?.trim() || "Unknown artist",
        oembedData.thumbnail_url,
        selectedGenres,
      );

      if (result.success) {
        setSuccess(true);
        setSuccessMessage(result.message);
        setUrl("");
        setOembedData(null);
        setSelectedGenres([]);
        // Refresh the UserTracksStats component
        setRefreshKey((prev) => prev + 1);
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 3000);
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
    <AppShell width="medium">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Your Tracks"
          title="Manage your tracks"
          description="Manage the tracks you have submitted and allow credits to get listening."
        />

        {success && (
          <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm lg:bottom-6 lg:right-6">
            <Notice tone="success" title="Track ready">
              {successMessage}
            </Notice>
          </div>
        )}
        <section aria-labelledby="submitted-tracks-heading">
          <UserSubmittedTracksList
            key={refreshKey}
            refreshKey={refreshKey}
            onTrackDeleted={handleTrackDeleted}
          />
        </section>
        <h2
          id="submitted-tracks-heading"
          className="mb-4 text-xl font-black text-ink"
        >
          Add a new track
        </h2>
        <Surface className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral/20 text-coral-strong">
              <Icon name="spotify" />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink">Paste Spotify URL</h2>
              <p className="mt-1 text-sm text-muted">
                Find a track on Spotify and copy its direct share link.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Input
              label="Spotify track URL"
              placeholder="https://open.spotify.com/track/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
            />

            {error && !oembedData && (
              <Notice tone="danger" title="Track could not be fetched">
                {error}
              </Notice>
            )}

            <Button
              onClick={handleFetchOembed}
              loading={isLoading}
              icon="search"
              className="w-full sm:w-auto"
            >
              Fetch Track Info
            </Button>
          </div>
        </Surface>

        {oembedData && (
          <Surface className="overflow-hidden">
            <div className="border-b border-border bg-surface-muted/55 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-strong">
                Preview
              </p>
              <div className="mt-3 flex items-center gap-4">
                {/* Spotify thumbnails are supplied dynamically by the oEmbed response. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={oembedData.thumbnail_url}
                  alt={oembedData.title}
                  className="size-16 shrink-0 rounded-control border border-border object-cover"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black text-ink">
                    {oembedData.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {oembedData.artistName?.trim() || "Unknown artist"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div
                className="overflow-hidden rounded-card border border-border bg-spotify-surface p-2"
                dangerouslySetInnerHTML={{ __html: oembedData.html }}
              />

              <GenreSelector
                value={selectedGenres}
                onChange={(genres) => {
                  setSelectedGenres(genres);
                  setError("");
                }}
              />

              {error && (
                <Notice tone="danger" title="Track could not be submitted">
                  {error}
                </Notice>
              )}

              {success && (
                <Notice tone="success" title="Track submitted successfully">
                  {successMessage}
                </Notice>
              )}

              <Button
                onClick={handleAddTrack}
                loading={isSubmitting}
                disabled={selectedGenres.length === 0}
                icon="upload"
                className="w-full"
              >
                Add This Track
              </Button>

              <p className="text-center text-xs text-muted">
                Adding: {oembedData.spotifyUrl}
              </p>

              <p className="text-center text-xs leading-5 text-muted">
                The track will be added to the discovery queue for other users
                to listen to and review.
              </p>
            </div>
          </Surface>
        )}

        <Notice tone="info" title="Tips">
          <ul className="space-y-1">
            <li>• Share original or curated independent tracks</li>
            <li>• Make sure the Spotify link is a direct track link</li>
            <li>• Tracks will appear in the discovery queue</li>
          </ul>
        </Notice>
      </div>
    </AppShell>
  );
}
