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
 * Get all submitted tracks for the current user
 * @returns Array of submitted tracks with full details
 */
export async function getUserSubmittedTracks(): Promise<
  Array<{
    id: string;
    track_id: string;
    title: string;
    cover_url: string;
    created_at: string;
  }>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("submitted_tracks")
      .select("id, track_id, title, cover_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tracks:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error getting user tracks:", err);
    return [];
  }
}

/**
 * Delete a submitted track
 * @param trackId - UUID of the submitted track
 * @returns Response with success status
 */
export async function deleteSubmittedTrack(
  trackId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to delete a track",
      };
    }

    // Delete the track (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from("submitted_tracks")
      .delete()
      .eq("id", trackId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to delete track. Please try again.",
      };
    }

    return {
      success: true,
      message: "Track deleted successfully",
    };
  } catch (err) {
    console.error("Delete track error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
}

/**
 * Get count of tracks submitted by the current user
 * @returns Number of submitted tracks, or 0 if not authenticated
 */
export async function getUserSubmittedTracksCount(): Promise<number> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from("submitted_tracks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user tracks count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Error getting tracks count:", err);
    return 0;
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

/**
 * Get all submitted tracks for discovery (excluding user's own tracks)
 * Users cannot give feedback on tracks they submitted themselves
 * @returns Array of submitted tracks sorted by newest first, excluding user's own tracks
 */
export async function getSubmittedTracks(): Promise<
  Array<{
    id: string;
    track_id: string;
    title: string;
    cover_url: string;
    created_at: string;
  }>
> {
  try {
    const supabase = await createClient();

    // Get current user to exclude their own tracks
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("submitted_tracks")
      .select("id, track_id, title, cover_url, created_at")
      .order("created_at", { ascending: false });

    // If user is authenticated, exclude their own tracks
    if (user) {
      query = query.neq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching submitted tracks:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error getting submitted tracks:", err);
    return [];
  }
}
