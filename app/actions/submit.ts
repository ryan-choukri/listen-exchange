"use server";

import { createClient } from "@/app/lib/supabase/server";

export interface SubmitTrackResponse {
  success: boolean;
  message: string;
  trackId?: string;
}

/**
 * Extract Spotify track ID from a Spotify URL
 * Supports formats:
 * - https://open.spotify.com/track/2lTm559tuIvatlT1u0JYG2
 * - https://open.spotify.com/track/2lTm559tuIvatlT1u0JYG2?si=...
 */
function extractSpotifyTrackId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Submit a Spotify track to the platform
 * @param url - Spotify track URL
 * @param title - Track title from oEmbed
 * @param coverUrl - Album cover URL from oEmbed
 * @returns Response with success status and message
 */
export async function submitTrack(
  url: string,
  title: string,
  coverUrl: string,
): Promise<SubmitTrackResponse> {
  try {
    // Extract track ID from URL
    const trackId = extractSpotifyTrackId(url);
    if (!trackId) {
      return {
        success: false,
        message: "Invalid Spotify track URL",
      };
    }

    // Validate inputs
    if (!title?.trim() || title.length > 500) {
      return {
        success: false,
        message: "Invalid track title",
      };
    }

    if (!coverUrl?.trim() || !coverUrl.startsWith("http")) {
      return {
        success: false,
        message: "Invalid cover URL",
      };
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to submit a track",
      };
    }

    // Check if user already submitted this track
    const { data: existing } = await supabase
      .from("submitted_tracks")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .single();

    if (existing) {
      return {
        success: false,
        message: "You have already submitted this track",
      };
    }

    // Insert the track
    const { data, error } = await supabase
      .from("submitted_tracks")
      .insert({
        user_id: user.id,
        track_id: trackId,
        title,
        cover_url: coverUrl,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to submit track. Please try again.",
      };
    }

    return {
      success: true,
      message: "Track submitted successfully! It's now available in Discovery.",
      trackId,
    };
  } catch (err) {
    console.error("Submit track error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
}
