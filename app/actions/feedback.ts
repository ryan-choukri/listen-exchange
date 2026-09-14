"use server";

import { createClient } from "@/app/lib/supabase/server";
import {
  SubmitFeedbackResponse,
  TrackFeedback,
  UserProfile,
} from "@/app/types/spotify";

/**
 * Submit feedback for a track and award credit atomically via RPC
 * @param trackId - Spotify track ID
 * @param feedback - User feedback text
 * @returns Response with success status, new credit count, and error message if any
 */
export async function submitTrackFeedback(
  trackId: string,
  feedback: string,
): Promise<SubmitFeedbackResponse & { error?: string }> {
  try {
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc("submit_track_feedback", {
      p_track_id: trackId,
      p_feedback: feedback,
    });

    if (error) {
      console.error("RPC error:", error);
      return {
        success: false,
        feedback_id: null,
        message: error.message,
        new_credits: null,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        feedback_id: null,
        message: "No response from server",
        new_credits: null,
        error: "No response from server",
      };
    }

    // RPC returns an array with one row
    const result = data[0] as SubmitFeedbackResponse;

    return {
      success: result.success,
      feedback_id: result.feedback_id,
      message: result.message,
      new_credits: result.new_credits,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Error submitting feedback:", errorMessage);
    return {
      success: false,
      feedback_id: null,
      message: "Error submitting feedback",
      new_credits: null,
      error: errorMessage,
    };
  }
}

/**
 * Get user's current credit count
 * @returns User profile with credits
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error("Error getting user profile:", err);
    return null;
  }
}

/**
 * Check if user already gave feedback on a specific track
 * @param trackId - Spotify track ID
 * @returns The existing feedback if it exists, null otherwise
 */
export async function getUserTrackFeedback(
  trackId: string,
): Promise<TrackFeedback | null> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from("track_feedbacks")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("track_id", trackId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows" error, which is expected
      console.error("Error fetching feedback:", error);
      return null;
    }

    return data ? (data as TrackFeedback) : null;
  } catch (err) {
    console.error("Error checking track feedback:", err);
    return null;
  }
}

/**
 * Get all feedback submitted by the user
 * @returns Array of feedback records
 */
export async function getUserFeedbacks(): Promise<TrackFeedback[]> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return [];
    }

    const { data, error } = await supabase
      .from("track_feedbacks")
      .select("*")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedbacks:", error);
      return [];
    }

    return data ? (data as TrackFeedback[]) : [];
  } catch (err) {
    console.error("Error getting user feedbacks:", err);
    return [];
  }
}
