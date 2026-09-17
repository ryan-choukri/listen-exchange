"use server";

import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";

export type ListeningSessionStatus =
  | "active"
  | "completed"
  | "rewarded"
  | "invalid"
  | "abandoned";

export interface ListeningConfigResult {
  success: boolean;
  minDurationMs: number | null;
  heartbeatIntervalMs: number | null;
  message?: string;
}

export interface ListeningSessionResult extends ListeningConfigResult {
  sessionId: string | null;
  status: ListeningSessionStatus | null;
  listenedMs: number;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SPOTIFY_TRACK_URI_PATTERN = /^spotify:track:[A-Za-z0-9]{22}$/;
const MAX_SPOTIFY_POSITION_MS = 86_400_000;

function isValidPosition(value: number) {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_SPOTIFY_POSITION_MS
  );
}

function parseSessionResult(value: unknown): ListeningSessionResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const status =
    typeof row.status === "string"
      ? (row.status as ListeningSessionStatus)
      : null;

  return {
    success: row.success === true,
    sessionId: typeof row.session_id === "string" ? row.session_id : null,
    status,
    listenedMs: Number(row.listened_ms ?? 0),
    minDurationMs:
      row.min_duration_ms == null ? null : Number(row.min_duration_ms),
    heartbeatIntervalMs:
      row.heartbeat_interval_ms == null
        ? null
        : Number(row.heartbeat_interval_ms),
    message: typeof row.message === "string" ? row.message : undefined,
  };
}

export async function getListeningConfig(): Promise<ListeningConfigResult> {
  const { supabase, identity } = await getAuthenticatedClient();

  if (!identity) {
    return {
      success: false,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Sign in to start a verified listen.",
    };
  }

  const { data, error } = await supabase.rpc("get_listening_config");
  const row = Array.isArray(data) ? data[0] : null;

  if (error || !row) {
    console.error("Listening config RPC failed:", error);
    return {
      success: false,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Listening verification is temporarily unavailable.",
    };
  }

  return {
    success: true,
    minDurationMs: Number(row.min_listen_duration_ms),
    heartbeatIntervalMs: Number(row.heartbeat_interval_ms),
  };
}

export async function startListeningSession(
  submittedTrackId: string,
  spotifyPositionMs: number,
  playingUri: string,
): Promise<ListeningSessionResult> {
  if (
    !UUID_PATTERN.test(submittedTrackId) ||
    !isValidPosition(spotifyPositionMs) ||
    !SPOTIFY_TRACK_URI_PATTERN.test(playingUri)
  ) {
    return {
      success: false,
      sessionId: null,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Invalid playback information.",
    };
  }

  const { supabase, identity } = await getAuthenticatedClient();

  if (!identity) {
    return {
      success: false,
      sessionId: null,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Sign in to start a verified listen.",
    };
  }

  const { data, error } = await supabase.rpc("start_listening_session", {
    p_track_id: submittedTrackId,
    p_spotify_position_ms: spotifyPositionMs,
    p_playing_uri: playingUri,
  });

  if (error) {
    console.error("Start listening session RPC failed:", error);
    return {
      success: false,
      sessionId: null,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "The verified listening session could not be started.",
    };
  }

  const result = parseSessionResult(Array.isArray(data) ? data[0] : null);
  return (
    result ?? {
      success: false,
      sessionId: null,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "No response from the listening server.",
    }
  );
}

export async function heartbeatListeningSession(
  sessionId: string,
  spotifyPositionMs: number,
  isPaused: boolean,
  isBuffering: boolean,
  playingUri: string,
): Promise<ListeningSessionResult> {
  if (
    !UUID_PATTERN.test(sessionId) ||
    !isValidPosition(spotifyPositionMs) ||
    typeof isPaused !== "boolean" ||
    typeof isBuffering !== "boolean" ||
    !SPOTIFY_TRACK_URI_PATTERN.test(playingUri)
  ) {
    return {
      success: false,
      sessionId,
      status: "invalid",
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Invalid playback information.",
    };
  }

  const { supabase, identity } = await getAuthenticatedClient();

  if (!identity) {
    return {
      success: false,
      sessionId,
      status: "invalid",
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Your session expired. Sign in again to continue.",
    };
  }

  const { data, error } = await supabase.rpc("heartbeat_listening_session", {
    p_session_id: sessionId,
    p_spotify_position_ms: spotifyPositionMs,
    p_is_paused: isPaused,
    p_is_buffering: isBuffering,
    p_playing_uri: playingUri,
  });

  if (error) {
    console.error("Listening heartbeat RPC failed:", error);
    return {
      success: false,
      sessionId,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "Listening verification lost connection.",
    };
  }

  const result = parseSessionResult(Array.isArray(data) ? data[0] : null);

  if (!result) {
    return {
      success: false,
      sessionId,
      status: null,
      listenedMs: 0,
      minDurationMs: null,
      heartbeatIntervalMs: null,
      message: "No response from the listening server.",
    };
  }

  return { ...result, sessionId };
}

export async function abandonListeningSession(sessionId: string) {
  if (!UUID_PATTERN.test(sessionId)) {
    return false;
  }

  const { supabase, identity } = await getAuthenticatedClient();
  if (!identity) {
    return false;
  }

  const { data, error } = await supabase.rpc("abandon_listening_session", {
    p_session_id: sessionId,
  });

  if (error) {
    console.error("Abandon listening session RPC failed:", error);
    return false;
  }

  return data === true;
}
