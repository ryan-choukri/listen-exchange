"use server";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";
import {
  isOnboardingEligible,
  type OnboardingStep,
} from "@/app/lib/onboarding";

export interface OnboardingState {
  eligible: boolean;
  step: OnboardingStep | null;
}

const INELIGIBLE_STATE: OnboardingState = {
  eligible: false,
  step: null,
};

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return INELIGIBLE_STATE;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", identity.id)
      .maybeSingle();

    if (
      profileError ||
      !profile?.created_at ||
      !isOnboardingEligible(profile.created_at)
    ) {
      if (profileError) {
        console.error("Error checking onboarding eligibility:", profileError);
      }
      return INELIGIBLE_STATE;
    }

    const { data: tracks, error: tracksError } = await supabase
      .from("submitted_tracks")
      .select("id, credits_remaining")
      .eq("user_id", identity.id)
      .is("deleted_at", null);

    if (tracksError) {
      console.error("Error checking onboarding tracks:", tracksError);
      return INELIGIBLE_STATE;
    }

    if (!tracks?.length) {
      return { eligible: true, step: 1 };
    }

    if (tracks.some((track) => Number(track.credits_remaining) >= 1)) {
      return { eligible: true, step: 4 };
    }

    const trackIds = tracks.map((track) => track.id);
    const { data: allocations, error: allocationsError } = await supabase
      .from("credit_transactions")
      .select("track_id, amount")
      .eq("user_id", identity.id)
      .eq("type", "track_allocation")
      .in("track_id", trackIds)
      .limit(500);

    if (allocationsError) {
      console.error("Error checking onboarding allocations:", allocationsError);
      return { eligible: true, step: 3 };
    }

    const allocatedByTrack = new Map<string, number>();
    for (const allocation of allocations ?? []) {
      if (!allocation.track_id) continue;
      allocatedByTrack.set(
        allocation.track_id,
        (allocatedByTrack.get(allocation.track_id) ?? 0) +
          Math.abs(Number(allocation.amount) || 0),
      );
    }

    return {
      eligible: true,
      step: [...allocatedByTrack.values()].some((amount) => amount >= 1)
        ? 4
        : 3,
    };
  } catch (error) {
    console.error("Error getting onboarding state:", error);
    return INELIGIBLE_STATE;
  }
}
