import "server-only";

import { cache } from "react";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

export interface AdminOverview {
  kpis: {
    total_users: number;
    new_users_today: number;
    total_tracks: number;
    valid_listens_today: number;
    feedback_today: number;
    completion_rate: number;
  };
  listening_system: {
    active_sessions: number;
    completed_today: number;
    invalid_today: number;
    average_validated_duration_ms: number;
    rewards_issued_today: number;
  };
  recent_activity: AdminActivity[];
}

export interface AdminActivity {
  event_type: string;
  occurred_at: string;
  actor_email: string | null;
  title: string;
  detail: string | null;
  status: string;
}

export interface AdminActivityPage {
  activities: AdminActivity[];
  totalCount: number;
  pageSize: number;
}

export interface AdminUserRow {
  user_id: string;
  email: string | null;
  signup_date: string;
  credits: number;
  tracks: number;
  valid_listens: number;
  feedbacks: number;
  status: string;
}

export interface AdminTrackRow {
  spotifyTrackId: string;
  track_id: string;
  spotify_track_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  owner_email: string | null;
  added_date: string;
  status: string;
  listens: number;
  feedbacks: number;
}

export interface AdminListeningRow {
  session_id: string;
  user_email: string | null;
  track_title: string | null;
  artist_name: string | null;
  started_at: string;
  validated_duration_ms: number;
  status: string;
  reward_status: string;
  invalid_reason: string | null;
}

export interface AdminMessageRow {
  message_id: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
}

export interface AdminFeedbackRow {
  feedback_id: string;
  user_id: string;
  user_email: string | null;
  track_id: string;
  track_title: string | null;
  artist_name: string | null;
  feedback: string;
  created_at: string;
}

export interface AdminSettings {
  min_listen_duration_ms: number;
  heartbeat_interval_ms: number;
  heartbeat_tolerance_ms: number;
  max_heartbeat_gap_ms: number;
  updated_at: string;
}

export interface AdminCredits {
  summary: {
    available_credits: number;
    allocated_credits: number;
    total_credits: number;
    funded_tracks: number;
  };
  top_tracks: Array<{
    track_id: string;
    title: string;
    artist_name: string | null;
    credits_allocated: number;
  }>;
  top_users: Array<{
    user_id: string;
    email: string | null;
    credits_available: number;
  }>;
}

type AdminRpcName =
  | "get_admin_overview"
  | "get_admin_users"
  | "get_admin_tracks"
  | "get_admin_credits"
  | "get_admin_listening"
  | "get_admin_feedback"
  | "get_admin_messages"
  | "get_admin_settings";

async function adminRpc<T>(name: AdminRpcName): Promise<T> {
  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.rpc(name);

  if (error) {
    throw new Error(`Admin query ${name} failed: ${error.message}`);
  }

  return data as T;
}

export const getAdminOverview = cache(() =>
  adminRpc<AdminOverview>("get_admin_overview"),
);

export const ADMIN_ACTIVITY_PAGE_SIZE = 100;

export const getAdminActivity = cache(
  async (page: number): Promise<AdminActivityPage> => {
    const safePage = Math.max(1, Math.trunc(page));
    const { supabase } = await requireSuperadmin();
    const { data, error } = await supabase.rpc("get_admin_activity", {
      p_offset: (safePage - 1) * ADMIN_ACTIVITY_PAGE_SIZE,
      p_limit: ADMIN_ACTIVITY_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Admin query get_admin_activity failed: ${error.message}`);
    }

    const payload = (data ?? {}) as {
      activities?: AdminActivity[];
      total_count?: number | string;
    };

    return {
      activities: Array.isArray(payload.activities) ? payload.activities : [],
      totalCount: Math.max(0, Number(payload.total_count ?? 0)),
      pageSize: ADMIN_ACTIVITY_PAGE_SIZE,
    };
  },
);

export const getAdminUsers = cache(() =>
  adminRpc<AdminUserRow[]>("get_admin_users"),
);

export const getAdminTracks = cache(() =>
  adminRpc<AdminTrackRow[]>("get_admin_tracks"),
);

export const getAdminCredits = cache(() =>
  adminRpc<AdminCredits>("get_admin_credits"),
);

export const getAdminListening = cache(() =>
  adminRpc<AdminListeningRow[]>("get_admin_listening"),
);

export const getAdminFeedback = cache(() =>
  adminRpc<AdminFeedbackRow[]>("get_admin_feedback"),
);

export const getAdminMessages = cache(() =>
  adminRpc<AdminMessageRow[]>("get_admin_messages"),
);

export const getAdminSettings = cache(async () => {
  const settings = await adminRpc<AdminSettings[]>("get_admin_settings");
  return settings[0] ?? null;
});
