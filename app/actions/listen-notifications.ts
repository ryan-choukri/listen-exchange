"use server";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";

interface ClaimedNotificationRow {
  listen_count: number | string;
  track_count: number | string;
  track_title: string | null;
  latest_completed_at: string | null;
}

export interface ListenNotification {
  listenCount: number;
  trackCount: number;
  trackTitle: string | null;
}

export async function claimOwnerListenNotification(): Promise<ListenNotification | null> {
  try {
    const { supabase, identity } = await getAuthenticatedClient();

    if (!identity) {
      return null;
    }

    const { data, error } = await supabase.rpc(
      "claim_new_listen_notification",
    );

    if (error) {
      console.error("Error claiming listen notification:", error);
      return null;
    }

    const row = (data as unknown as ClaimedNotificationRow[] | null)?.[0];
    const listenCount = Number(row?.listen_count ?? 0);
    const trackCount = Number(row?.track_count ?? 0);

    if (!row || !Number.isSafeInteger(listenCount) || listenCount <= 0) {
      return null;
    }

    return {
      listenCount,
      trackCount: Number.isSafeInteger(trackCount) ? trackCount : 0,
      trackTitle:
        typeof row.track_title === "string" ? row.track_title : null,
    };
  } catch (error) {
    console.error("Error checking listen notifications:", error);
    return null;
  }
}
