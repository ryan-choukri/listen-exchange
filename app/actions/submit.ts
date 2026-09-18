"use server";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";
import {
  isMusicGenre,
  type MusicGenre,
} from "@/app/types/spotify";

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
  artist_name: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
  genres: MusicGenre[];
  feedback_count: number;
  feedbacks: SubmittedTrackFeedback[];
}

export interface DiscoverTrack {
  id: string;
  track_id: string;
  title: string;
  artist_name: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
  genres: MusicGenre[];
}

export interface DiscoverCursor {
  createdAt: string;
  id: string;
}

export interface DiscoverTracksPage {
  tracks: DiscoverTrack[];
  nextCursor: DiscoverCursor | null;
  hasMore: boolean;
}

const DISCOVER_BATCH_SIZE = 25;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function hasValidGenres(value: unknown): value is MusicGenre[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= 3 &&
    value.every(isMusicGenre) &&
    new Set(value).size === value.length
  );
}

function parseMusicGenres(value: unknown): MusicGenre[] {
  if (!Array.isArray(value)) {
    return ["Other"];
  }

  const genres = value.filter(isMusicGenre);
  return genres.length >= 1 && genres.length <= 3 ? genres : ["Other"];
}

function parseArtistName(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : "Unknown artist";
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
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
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
        artist_name: parseArtistName(track.artist_name),
        cover_url: String(track.cover_url ?? ""),
        created_at: String(track.created_at ?? ""),
        credits_remaining: Number(track.credits_remaining ?? 0),
        status: String(track.status ?? "pending"),
        genres: parseMusicGenres(track.genres),
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
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
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
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return 0;
    }

    const { count, error } = await supabase
      .from("submitted_tracks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", identity.id)
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
 * @param artistName - Artist name from Spotify metadata
 * @param coverUrl - Album cover URL from oEmbed
 * @param genres - One to three selected genres
 * @returns Response with success status and message
 */
export async function submitTrack(
  url: string,
  title: string,
  artistName: string,
  coverUrl: string,
  genres: MusicGenre[],
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

    if (!artistName?.trim() || artistName.trim().length > 300) {
      return {
        success: false,
        message: "Invalid artist name",
      };
    }

    if (!coverUrl?.trim() || !coverUrl.startsWith("http")) {
      return {
        success: false,
        message: "Invalid cover URL",
      };
    }

    if (!hasValidGenres(genres)) {
      return {
        success: false,
        message: "Select between 1 and 3 valid genres",
      };
    }

    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return {
        success: false,
        message: "You must be logged in to submit a track",
      };
    }

    // Check if user already submitted this track
    const { data: existing, error: existingError } = await supabase
      .from("submitted_tracks")
      .select("id, status, deleted_at")
      .eq("user_id", identity.id)
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
            p_artist_name: artistName,
            p_cover_url: coverUrl,
            p_genres: genres,
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

    // Create through the database RPC so ownership and initial credit state
    // cannot be supplied or overridden by the caller.
    const { data: createdData, error: createdError } = await supabase.rpc(
      "create_submitted_track",
      {
        p_track_id: trackId,
        p_title: title,
        p_artist_name: artistName,
        p_cover_url: coverUrl,
        p_genres: genres,
      },
    );

    if (createdError || !createdData?.length) {
      console.error("Create track RPC error:", createdError);
      return {
        success: false,
        message: "Failed to submit track. Please try again.",
      };
    }

    const created = createdData[0] as {
      success: boolean;
      message: string;
    };

    if (!created.success) {
      return {
        success: false,
        message: created.message,
      };
    }

    return {
      success: true,
      message: created.message,
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
 * Get eligible submitted tracks from the database-filtered Discover queue.
 * Own tracks and Spotify tracks already rewarded for this listener are excluded.
 */
export async function getSubmittedTracks(
  cursor?: DiscoverCursor,
): Promise<DiscoverTracksPage> {
  try {
    if (
      cursor &&
      (!UUID_PATTERN.test(cursor.id) ||
        !Number.isFinite(Date.parse(cursor.createdAt)))
    ) {
      return { tracks: [], nextCursor: null, hasMore: false };
    }

    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return { tracks: [], nextCursor: null, hasMore: false };
    }

    const { data, error } = await supabase.rpc("get_discover_tracks", {
      p_limit: DISCOVER_BATCH_SIZE,
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
    });

    if (error) {
      console.error("Error fetching submitted tracks:", error);
      return { tracks: [], nextCursor: null, hasMore: false };
    }

    const tracks = ((data || []) as Array<Record<string, unknown>>).map(
      (track) => ({
        id: String(track.id ?? ""),
        track_id: String(track.track_id ?? ""),
        title: String(track.title ?? ""),
        artist_name: parseArtistName(track.artist_name),
        cover_url: String(track.cover_url ?? ""),
        created_at: String(track.created_at ?? ""),
        credits_remaining: Number(track.credits_remaining ?? 0),
        status: String(track.status ?? "pending"),
        genres: parseMusicGenres(track.genres),
      }),
    );
    const lastTrack = tracks.at(-1);
    const hasMore = tracks.length === DISCOVER_BATCH_SIZE;

    return {
      tracks,
      hasMore,
      nextCursor:
        hasMore && lastTrack
          ? { createdAt: lastTrack.created_at, id: lastTrack.id }
          : null,
    };
  } catch (err) {
    console.error("Error getting submitted tracks:", err);
    return { tracks: [], nextCursor: null, hasMore: false };
  }
}
