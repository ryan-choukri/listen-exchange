"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";

export interface AllocateCreditsResponse {
  success: boolean;
  message: string;
  credits_balance?: number;
  credits_remaining?: number;
  status?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  track_id: string | null;
  feedback_id: string | null;
  amount: number;
  type: "feedback_reward" | "track_allocation" | "refund";
  description: string | null;
  created_at: string;
}

/**
 * Allocate credits to a user's track to activate it for discovery
 * @param trackId - UUID of the submitted track
 * @param amount - Number of credits to allocate (must be > 0)
 * @returns Response with success status and updated credit values
 */
export async function allocateTracksCredits(
  trackId: string,
  amount: number,
): Promise<AllocateCreditsResponse> {
  try {
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc("allocate_track_credits", {
      p_track_id: trackId,
      p_amount: amount,
    });

    if (error) {
      console.error("RPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to allocate credits",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No response from server",
      };
    }

    const result = data[0] as AllocateCreditsResponse;

    return {
      success: result.success,
      message: result.message,
      credits_balance: result.credits_balance,
      credits_remaining: result.credits_remaining,
      status: result.status,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Error allocating credits:", errorMessage);
    return {
      success: false,
      message: "Error allocating credits",
    };
  }
}

/**
 * Remove credits from a user's track (refund)
 * @param trackId - UUID of the submitted track
 * @param amount - Number of credits to remove (must be > 0)
 * @returns Response with success status and updated credit values
 */
export async function removeTracksCredits(
  trackId: string,
  amount: number,
): Promise<AllocateCreditsResponse> {
  try {
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc("remove_track_credits", {
      p_track_id: trackId,
      p_amount: amount,
    });

    if (error) {
      console.error("RPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to return credits",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No response from server",
      };
    }

    const result = data[0] as AllocateCreditsResponse;

    return {
      success: result.success,
      message: result.message,
      credits_balance: result.credits_balance,
      credits_remaining: result.credits_remaining,
      status: result.status,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Error returning credits:", errorMessage);
    return {
      success: false,
      message: "Error returning credits",
    };
  }
}

/**
 * Get a track's credit information
 * @param trackId - UUID of the submitted track
 * @returns Track credits and status
 */
export async function getTrackCredits(trackId: string): Promise<{
  credits_remaining: number;
  status: string;
} | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("submitted_tracks")
      .select("credits_remaining, status")
      .eq("id", trackId)
      .single();

    if (error || !data) {
      console.error("Error fetching track credits:", error);
      return null;
    }

    return {
      credits_remaining: data.credits_remaining,
      status: data.status,
    };
  } catch (err) {
    console.error("Error getting track credits:", err);
    return null;
  }
}

/**
 * Get user's credit transaction history
 * @returns Array of credit transactions for the current user
 */
export async function getUserCreditTransactions(): Promise<
  CreditTransaction[]
> {
  try {
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return [];
    }

    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", identity.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transaction history:", error);
      return [];
    }

    return (data as CreditTransaction[]) || [];
  } catch (err) {
    console.error("Error getting credit transactions:", err);
    return [];
  }
}

/**
 * Get track credit history (transactions related to a specific track)
 * @param trackId - UUID of the submitted track
 * @returns Array of transactions for the track
 */
export async function getTrackCreditHistory(
  trackId: string,
): Promise<CreditTransaction[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("track_id", trackId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching track credit history:", error);
      return [];
    }

    return (data as CreditTransaction[]) || [];
  } catch (err) {
    console.error("Error getting track credit history:", err);
    return [];
  }
}
