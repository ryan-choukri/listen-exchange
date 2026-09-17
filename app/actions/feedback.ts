"use server";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";
import {
  SubmitFeedbackResponse,
  TrackFeedback,
} from "@/app/types/spotify";

/**
 * Submit feedback for a server-verified listening session and award credit
 * atomically via RPC.
 * @param listeningSessionId - Server-issued listening session UUID
 * @param feedback - User feedback text
 * @returns Response with success status, new credit count, and error message if any
 */
export async function submitTrackFeedback(
  listeningSessionId: string,
  feedback: string,
): Promise<SubmitFeedbackResponse & { error?: string }> {
  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        listeningSessionId,
      )
    ) {
      return {
        success: false,
        feedback_id: null,
        message: "Complete a verified listen before submitting feedback.",
        new_credits: null,
      };
    }

    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 10 || trimmedFeedback.length > 500) {
      return {
        success: false,
        feedback_id: null,
        message: "Feedback must contain between 10 and 500 characters.",
        new_credits: null,
      };
    }

    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return {
        success: false,
        feedback_id: null,
        message: "You must be signed in to submit feedback.",
        new_credits: null,
      };
    }

    const { data, error } = await supabase.rpc("submit_track_feedback", {
      p_listening_session_id: listeningSessionId,
      p_feedback: trimmedFeedback,
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
 * Check if user already gave feedback on a specific track
 * @param trackId - Spotify track ID
 * @returns The existing feedback if it exists, null otherwise
 */
export async function getUserTrackFeedback(
  trackId: string,
): Promise<TrackFeedback | null> {
  try {
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return null;
    }

    const { data, error } = await supabase
      .from("track_feedbacks")
      .select("*")
      .eq("user_id", identity.id)
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
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return [];
    }

    const { data, error } = await supabase
      .from("track_feedbacks")
      .select("*")
      .eq("user_id", identity.id)
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
