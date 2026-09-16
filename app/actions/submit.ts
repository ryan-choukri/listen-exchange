"use server";

import { createClient } from "@/app/lib/supabase/server";

export interface SubmitTrackResponse {
  success: boolean;
  message: string;
  trackId?: string;
}

export interface DeleteSubmittedTrackResponse {
  success: boolean;
  message: string;
  listensReturned?: number;
  creditsBalance?: number;
  alreadyRemoved?: boolean;
}

interface SubmittedTrackFeedback {
  id: string;
  feedback: string;
  created_at: string;
}

interface UserSubmittedTrack {
  id: string;
  track_id: string;
  title: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
  feedback_count: number;
  feedbacks: SubmittedTrackFeedback[];
}

function parseSubmittedTrackFeedbacks(value: unknown): SubmittedTrackFeedback[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const feedback = item as Record<string, unknown>;
    if (
      typeof feedback.id !== "string" ||
      typeof feedback.feedback !== "string" ||
      typeof feedback.created_at !== "string"
    ) {
      return [];
    }

    return [
      {
        id: feedback.id,
        feedback: feedback.feedback,
        created_at: feedback.created_at,
      },
    ];
  });
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
 * @returns Array of submitted tracks with full details including credits
 */
export async function getUserSubmittedTracks(): Promise<
  UserSubmittedTrack[]
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase.rpc(
      "get_owner_submitted_tracks_with_feedbacks",
    );

    if (error) {
      console.error("Error fetching user tracks:", error);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const track = item as Record<string, unknown>;
      return {
        id: String(track.id ?? ""),
        track_id: String(track.track_id ?? ""),
        title: String(track.title ?? ""),
        cover_url: String(track.cover_url ?? ""),
        created_at: String(track.created_at ?? ""),
        credits_remaining: Number(track.credits_remaining ?? 0),
        status: String(track.status ?? "pending"),
        feedback_count: Number(track.feedback_count ?? 0),
        feedbacks: parseSubmittedTrackFeedbacks(track.feedbacks),
      };
    });
  } catch (err) {
    console.error("Error getting user tracks:", err);
    return [];
  }
}

/**
 * Remove a submitted track and atomically return its unused listens
 * @param trackId - UUID of the submitted track
 * @returns Response with success status
 */
export async function deleteSubmittedTrack(
  trackId: string,
): Promise<DeleteSubmittedTrackResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to remove a track",
      };
    }

    const { data, error } = await supabase.rpc("remove_submitted_track", {
      p_track_id: trackId,
    });

    if (error) {
      console.error("Remove track RPC error:", error);
      return {
        success: false,
        message: "Failed to remove track. Your balance was not changed.",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No response from the server. Your balance was not changed.",
      };
    }

    const result = data[0] as {
      success: boolean;
      message: string;
      listens_returned: number;
      credits_balance: number;
      already_removed: boolean;
    };

    return {
      success: result.success,
      message: result.message,
      listensReturned: result.listens_returned,
      creditsBalance: result.credits_balance,
      alreadyRemoved: result.already_removed,
    };
  } catch (err) {
    console.error("Remove track error:", err);
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
      .eq("user_id", user.id)
      .is("deleted_at", null);

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
    const { data: existing, error: existingError } = await supabase
      .from("submitted_tracks")
      .select("id, status, deleted_at")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing track:", existingError);
      return {
        success: false,
        message: "Could not verify this track. Please try again.",
      };
    }

    if (existing) {
      if (existing.status === "deleted" || existing.deleted_at) {
        const { data: reactivatedData, error: reactivatedError } =
          await supabase.rpc("reactivate_submitted_track", {
            p_track_id: existing.id,
            p_title: title,
            p_cover_url: coverUrl,
          });

        if (reactivatedError || !reactivatedData?.length) {
          console.error("Reactivate track RPC error:", reactivatedError);
          return {
            success: false,
            message: "Failed to reactivate track. Please try again.",
          };
        }

        const reactivated = reactivatedData[0] as {
          success: boolean;
          message: string;
        };

        return {
          success: reactivated.success,
          message: reactivated.message,
          trackId: reactivated.success ? trackId : undefined,
        };
      }

      return {
        success: false,
        message: "You have already submitted this track",
      };
    }

    // Insert the track
    const { error } = await supabase.from("submitted_tracks").insert({
      user_id: user.id,
      track_id: trackId,
      title,
      cover_url: coverUrl,
    });

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to submit track. Please try again.",
      };
    }

    return {
      success: true,
      message: "Track submitted. Allocate credits to add it to Discovery.",
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
    credits_remaining: number;
    status: string;
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
      .select(
        "id, track_id, title, cover_url, created_at, credits_remaining, status",
      )
      .eq("status", "active")
      .is("deleted_at", null)
      .gt("credits_remaining", 0)
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
