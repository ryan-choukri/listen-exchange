"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  abandonListeningSession,
  getListeningConfig,
  heartbeatListeningSession,
  startListeningSession,
  type ListeningSessionResult,
  type ListeningSessionStatus,
} from "@/app/actions/listening";

interface SpotifyPlaybackData {
  position?: number;
  duration?: number;
  isPaused?: boolean;
  isBuffering?: boolean;
  playingURI?: string;
}

interface SpotifyIFrameEvent {
  data?: SpotifyPlaybackData;
}

interface SpotifyEmbedController {
  addListener(
    event: "ready" | "playback_started" | "playback_update",
    callback: (event: SpotifyIFrameEvent) => void,
  ): void;
  destroy(): void;
}

interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: {
      url?: string;
      uri?: string;
      width?: string | number;
      height?: string | number;
    },
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

interface PlaybackSnapshot {
  positionMs: number;
  isPaused: boolean;
  isBuffering: boolean;
  playingUri: string;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    __spotifyIframeAPI?: SpotifyIFrameAPI;
    __spotifyIframePromise?: Promise<SpotifyIFrameAPI>;
  }
}

const SCRIPT_ID = "spotify-iframe-api";
const SCRIPT_URL = "https://open.spotify.com/embed/iframe-api/v1";
const MAX_NORMAL_POSITION_DELTA_MS = 5_000;
const STARTUP_STABLE_UPDATE_COUNT = 2;
const TINY_BACKWARD_CORRECTION_MS = 1_000;
const CLEAR_RESTART_POSITION_MS = 1_500;
const CLEAR_RESTART_MIN_PREVIOUS_POSITION_MS = 5_000;
const PROLONGED_PLAYBACK_INTERRUPTION_MS = 9_000;
const FORWARD_SEEK_TOLERANCE_MS = 650;
const PREVIEW_WARNING_RESET_THRESHOLD = 2;

type PlaybackResetReason =
  | "explicit_pause"
  | "track_change"
  | "forward_seek"
  | "restart"
  | "backward_seek"
  | "page_hidden"
  | "prolonged_buffering"
  | "prolonged_no_progress"
  | "stale_server_session"
  | "server_invalid"
  | "manual_reset";

function isMobileDevice() {
  const mobileUserAgent =
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    );
  const isiPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return mobileUserAgent || isiPadOS;
}

function subscribeToDeviceType() {
  return () => {};
}

function getServerDeviceType() {
  return false;
}

function loadSpotifyIFrameAPI(): Promise<SpotifyIFrameAPI> {
  if (window.__spotifyIframeAPI) {
    return Promise.resolve(window.__spotifyIframeAPI);
  }

  if (window.__spotifyIframePromise) {
    return window.__spotifyIframePromise;
  }

  window.__spotifyIframePromise = new Promise<SpotifyIFrameAPI>(
    (resolve, reject) => {
      window.onSpotifyIframeApiReady = (api) => {
        window.__spotifyIframeAPI = api;
        resolve(api);
      };

      document.getElementById(SCRIPT_ID)?.remove();

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.onerror = () => {
        window.__spotifyIframePromise = undefined;
        reject(new Error("Spotify iframe API failed to load"));
      };

      document.body.appendChild(script);
    },
  );

  return window.__spotifyIframePromise;
}

export function useSpotifyTracker(
  spotifyUrl: string,
  submittedTrackId: string,
) {
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const statusRef = useRef<ListeningSessionStatus | null>(null);
  const latestPlaybackRef = useRef<PlaybackSnapshot | null>(null);
  const lastHeartbeatPositionRef = useRef<number | null>(null);
  const continuousListenedMsRef = useRef(0);
  const requiredMsRef = useRef<number | null>(null);
  const playbackGenerationRef = useRef(0);
  const pendingAbandonRef = useRef<Promise<boolean> | null>(null);
  const playbackResetCountRef = useRef(0);
  const playbackInitializedRef = useRef(false);
  const stablePlaybackUpdatesRef = useRef(0);
  const resumeBaselinePendingRef = useRef(false);
  const backwardCandidatePositionRef = useRef<number | null>(null);
  const lastAcceptedPlaybackAtRef = useRef<number | null>(null);
  const lastProgressEventAtRef = useRef<number | null>(null);
  const bufferingTimeoutRef = useRef<number | null>(null);
  const bufferingReportedRef = useRef(false);
  const startInFlightRef = useRef(false);
  const heartbeatInFlightRef = useRef(false);

  const [listenedMs, setListenedMs] = useState(0);
  const [requiredMs, setRequiredMs] = useState<number | null>(null);
  const [heartbeatIntervalMs, setHeartbeatIntervalMs] = useState<
    number | null
  >(null);
  const [listeningStatus, setListeningStatus] =
    useState<ListeningSessionStatus | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const mobileValidationDisabled = useSyncExternalStore(
    subscribeToDeviceType,
    isMobileDevice,
    getServerDeviceType,
  );
  const [showPreviewHelp, setShowPreviewHelp] = useState(false);

  const logPlaybackEvent = useCallback(
    (
      eventType: string,
      previous: PlaybackSnapshot | null,
      next: PlaybackSnapshot | null,
      decision: string,
      resetReason: PlaybackResetReason | null = null,
      timing?: {
        realElapsedMs: number | null;
        progressionDifferenceMs: number | null;
      },
    ) => {
      if (process.env.NODE_ENV === "production") return;

      const spotifyDeltaMs =
        previous && next ? next.positionMs - previous.positionMs : null;
      console.debug("[useSpotifyTracker]", {
        eventType,
        previousSpotifyPositionMs: previous?.positionMs ?? null,
        newSpotifyPositionMs: next?.positionMs ?? null,
        spotifyDeltaMs,
        continuousProgressMs: continuousListenedMsRef.current,
        initialized: playbackInitializedRef.current,
        stablePlaybackUpdates: stablePlaybackUpdatesRef.current,
        paused: next?.isPaused ?? null,
        buffering: next?.isBuffering ?? null,
        realElapsedMs: timing?.realElapsedMs ?? null,
        progressionDifferenceMs: timing?.progressionDifferenceMs ?? null,
        decision,
        resetReason,
      });
    },
    [],
  );

  const notePlaybackReset = useCallback((hadMeaningfulProgress: boolean) => {
    if (!hadMeaningfulProgress) return;

    playbackResetCountRef.current += 1;
    if (
      playbackResetCountRef.current >= PREVIEW_WARNING_RESET_THRESHOLD
    ) {
      setShowPreviewHelp(true);
    }
  }, []);

  const queueSessionAbandon = useCallback((currentSessionId: string) => {
    const request = abandonListeningSession(currentSessionId).catch((error) => {
      console.error("Unable to abandon interrupted listening session:", error);
      return false;
    });

    pendingAbandonRef.current = request;
    void request.finally(() => {
      if (pendingAbandonRef.current === request) {
        pendingAbandonRef.current = null;
      }
    });

    return request;
  }, []);

  const interruptListening = useCallback(
    (
      nextBaseline: PlaybackSnapshot | null,
      countForPreviewHelp = true,
      resetReason: PlaybackResetReason = "manual_reset",
      timing?: {
        realElapsedMs: number | null;
        progressionDifferenceMs: number | null;
      },
    ) => {
      const currentSessionId = sessionIdRef.current;
      const hadMeaningfulProgress = continuousListenedMsRef.current >= 1_000;
      const previousSnapshot = latestPlaybackRef.current;

      logPlaybackEvent(
        "playback_reset",
        previousSnapshot,
        nextBaseline,
        "reset",
        resetReason,
        timing,
      );

      if (bufferingTimeoutRef.current !== null) {
        window.clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
      playbackGenerationRef.current += 1;
      if (currentSessionId && statusRef.current === "active") {
        queueSessionAbandon(currentSessionId);
      }

      sessionIdRef.current = null;
      statusRef.current = null;
      latestPlaybackRef.current = nextBaseline;
      lastHeartbeatPositionRef.current = null;
      continuousListenedMsRef.current = 0;
      playbackInitializedRef.current = false;
      stablePlaybackUpdatesRef.current = 0;
      resumeBaselinePendingRef.current = false;
      backwardCandidatePositionRef.current = null;
      lastAcceptedPlaybackAtRef.current = null;
      lastProgressEventAtRef.current = null;
      bufferingReportedRef.current = false;
      setSessionId(null);
      setListeningStatus(null);
      setListenedMs(0);
      setIsPlaying(false);

      if (countForPreviewHelp) {
        notePlaybackReset(hadMeaningfulProgress);
      }
    },
    [logPlaybackEvent, notePlaybackReset, queueSessionAbandon],
  );

  const applyServerResult = useCallback((result: ListeningSessionResult) => {
    if (result.minDurationMs !== null) {
      requiredMsRef.current = result.minDurationMs;
      setRequiredMs(result.minDurationMs);
    }
    if (result.heartbeatIntervalMs !== null) {
      setHeartbeatIntervalMs(result.heartbeatIntervalMs);
    }

    const serverListenedMs = Math.max(0, result.listenedMs);
    if (result.status === "completed" || result.status === "rewarded") {
      continuousListenedMsRef.current = serverListenedMs;
      setListenedMs(serverListenedMs);
    } else if (result.status !== "invalid" && result.status !== "abandoned") {
      const verifiedProgress = Math.max(
        continuousListenedMsRef.current,
        serverListenedMs,
      );
      continuousListenedMsRef.current = verifiedProgress;
      setListenedMs(verifiedProgress);
    }

    if (result.status) {
      statusRef.current = result.status;
      setListeningStatus(result.status);
    }

    if (result.sessionId) {
      sessionIdRef.current = result.sessionId;
      setSessionId(result.sessionId);
    }

    if (result.success) {
      setListeningError(null);
    } else if (result.message) {
      setListeningError(result.message);
    }

    if (result.status === "invalid" || result.status === "abandoned") {
      logPlaybackEvent(
        "server_result",
        latestPlaybackRef.current,
        latestPlaybackRef.current,
        "reset",
        "server_invalid",
      );
      notePlaybackReset(
        continuousListenedMsRef.current >= 1_000 || serverListenedMs >= 1_000,
      );
      continuousListenedMsRef.current = 0;
      playbackInitializedRef.current = false;
      stablePlaybackUpdatesRef.current = 0;
      resumeBaselinePendingRef.current = false;
      backwardCandidatePositionRef.current = null;
      lastHeartbeatPositionRef.current = null;
      lastAcceptedPlaybackAtRef.current = null;
      lastProgressEventAtRef.current = null;
      bufferingReportedRef.current = false;
      setListenedMs(0);
      sessionIdRef.current = null;
      setSessionId(null);
      setIsPlaying(false);
    }
  }, [logPlaybackEvent, notePlaybackReset]);

  const sendHeartbeat = useCallback(async (
    snapshotOverride?: PlaybackSnapshot,
    forcePlaybackState = false,
  ) => {
    const currentSessionId = sessionIdRef.current;
    const snapshot = snapshotOverride ?? latestPlaybackRef.current;

    if (
      mobileValidationDisabled ||
      !currentSessionId ||
      !snapshot ||
      heartbeatInFlightRef.current ||
      statusRef.current !== "active" ||
      ((!forcePlaybackState) &&
        (snapshot.isPaused || snapshot.isBuffering)) ||
      document.hidden
    ) {
      return;
    }

    if (
      !forcePlaybackState &&
      lastHeartbeatPositionRef.current !== null &&
      snapshot.positionMs <= lastHeartbeatPositionRef.current
    ) {
      const lastProgressAt = lastProgressEventAtRef.current;
      const noProgressForMs =
        lastProgressAt === null ? 0 : performance.now() - lastProgressAt;
      const heartbeatBaseline: PlaybackSnapshot = {
        ...snapshot,
        positionMs: lastHeartbeatPositionRef.current,
      };

      if (noProgressForMs >= PROLONGED_PLAYBACK_INTERRUPTION_MS) {
        interruptListening(
          snapshot,
          true,
          "prolonged_no_progress",
        );
      } else {
        logPlaybackEvent(
          "heartbeat",
          heartbeatBaseline,
          snapshot,
          "ignored_no_new_position",
        );
      }
      return;
    }

    const requestGeneration = playbackGenerationRef.current;
    const heartbeatBaseline =
      lastHeartbeatPositionRef.current === null
        ? null
        : {
            ...snapshot,
            positionMs: lastHeartbeatPositionRef.current,
          };
    logPlaybackEvent(
      "heartbeat",
      heartbeatBaseline,
      snapshot,
      forcePlaybackState ? "sending_playback_state" : "sending_progress",
    );
    heartbeatInFlightRef.current = true;
    try {
      const result = await heartbeatListeningSession(
        currentSessionId,
        snapshot.positionMs,
        snapshot.isPaused,
        snapshot.isBuffering,
        snapshot.playingUri,
      );

      if (
        sessionIdRef.current !== currentSessionId ||
        playbackGenerationRef.current !== requestGeneration
      ) {
        return;
      }

      applyServerResult(result);

      if (result.success) {
        lastHeartbeatPositionRef.current = snapshot.positionMs;
      }
    } catch (error) {
      console.error("Verified listening heartbeat failed:", error);
      setListeningError("Listening verification lost connection.");
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [
    applyServerResult,
    interruptListening,
    logPlaybackEvent,
    mobileValidationDisabled,
  ]);

  const ensureSession = useCallback(
    async (snapshot: PlaybackSnapshot) => {
      if (
        mobileValidationDisabled ||
        sessionIdRef.current ||
        startInFlightRef.current ||
        statusRef.current === "completed" ||
        statusRef.current === "rewarded"
      ) {
        return;
      }

      startInFlightRef.current = true;
      const requestGeneration = playbackGenerationRef.current;
      try {
        const pendingAbandon = pendingAbandonRef.current;
        if (pendingAbandon) {
          const abandoned = await pendingAbandon;
          if (!abandoned) {
            setListeningError(
              "The interrupted listening session could not be reset.",
            );
            return;
          }
        }

        const result = await startListeningSession(
          submittedTrackId,
          snapshot.positionMs,
          snapshot.playingUri,
        );

        if (
          playbackGenerationRef.current !== requestGeneration ||
          mobileValidationDisabled
        ) {
          if (result.sessionId && result.status === "active") {
            queueSessionAbandon(result.sessionId);
          }
          return;
        }

        if (
          result.sessionId &&
          result.status === "active" &&
          result.listenedMs > 0
        ) {
          queueSessionAbandon(result.sessionId);
          interruptListening(snapshot, false, "stale_server_session");
          return;
        }

        applyServerResult(result);

        if (result.success && result.status === "active") {
          lastHeartbeatPositionRef.current = snapshot.positionMs;
        }
      } catch (error) {
        console.error("Unable to start verified listening:", error);
        setListeningError("The verified listening session could not start.");
      } finally {
        startInFlightRef.current = false;
      }
    },
    [
      applyServerResult,
      interruptListening,
      mobileValidationDisabled,
      queueSessionAbandon,
      submittedTrackId,
    ],
  );

  const handlePlaybackUpdate = useCallback(
    (event: SpotifyIFrameEvent) => {
      const data = event.data;
      const positionMs = Math.trunc(Number(data?.position));
      const playingUri = data?.playingURI;
      const isPaused = data?.isPaused !== false;
      const isBuffering = data?.isBuffering === true;

      if (
        !Number.isFinite(positionMs) ||
        positionMs < 0 ||
        typeof playingUri !== "string"
      ) {
        return;
      }

      const snapshot: PlaybackSnapshot = {
        positionMs,
        isPaused,
        isBuffering,
        playingUri,
      };

      const eventObservedAt = performance.now();
      const previousSnapshot = latestPlaybackRef.current;
      const realElapsedMs =
        lastAcceptedPlaybackAtRef.current === null
          ? null
          : Math.max(
              0,
              eventObservedAt - lastAcceptedPlaybackAtRef.current,
            );
      const progressionDifferenceMs =
        previousSnapshot && realElapsedMs !== null
          ? positionMs - previousSnapshot.positionMs - realElapsedMs
          : null;
      const eventTiming = { realElapsedMs, progressionDifferenceMs };
      logPlaybackEvent(
        "playback_update",
        previousSnapshot,
        snapshot,
        "received",
        null,
        eventTiming,
      );

      if (mobileValidationDisabled) {
        latestPlaybackRef.current = snapshot;
        continuousListenedMsRef.current = 0;
        setListenedMs(0);
        setIsPlaying(false);
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "ignored_mobile",
        );
        return;
      }

      if (statusRef.current === "completed" || statusRef.current === "rewarded") {
        setIsPlaying(false);
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "ignored_already_complete",
        );
        return;
      }

      const expectedTrackId = spotifyUrl.match(
        /open\.spotify\.com\/track\/([A-Za-z0-9]{22})/,
      )?.[1];
      const expectedPlayingUri = expectedTrackId
        ? `spotify:track:${expectedTrackId}`
        : null;

      if (!expectedPlayingUri || playingUri !== expectedPlayingUri) {
        interruptListening(snapshot, true, "track_change");
        return;
      }

      if (document.hidden) {
        interruptListening(snapshot, true, "page_hidden");
        return;
      }

      if (isBuffering) {
        setIsPlaying(false);
        resumeBaselinePendingRef.current = true;
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "buffering_preserve_progress",
        );

        if (bufferingTimeoutRef.current === null) {
          bufferingTimeoutRef.current = window.setTimeout(() => {
            bufferingTimeoutRef.current = null;
            if (!resumeBaselinePendingRef.current) return;

            interruptListening(
              latestPlaybackRef.current,
              true,
              "prolonged_buffering",
            );
          }, PROLONGED_PLAYBACK_INTERRUPTION_MS);
        }

        if (
          !bufferingReportedRef.current &&
          !heartbeatInFlightRef.current &&
          sessionIdRef.current &&
          statusRef.current === "active"
        ) {
          bufferingReportedRef.current = true;
          const bufferingSnapshot = previousSnapshot
            ? {
                ...snapshot,
                positionMs: previousSnapshot.positionMs,
              }
            : snapshot;
          void sendHeartbeat(bufferingSnapshot, true);
        }
        return;
      }

      if (bufferingTimeoutRef.current !== null) {
        window.clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }

      if (isPaused) {
        interruptListening(snapshot, true, "explicit_pause");
        return;
      }

      if (resumeBaselinePendingRef.current) {
        resumeBaselinePendingRef.current = false;
        bufferingReportedRef.current = false;
        latestPlaybackRef.current = snapshot;
        lastAcceptedPlaybackAtRef.current = eventObservedAt;
        backwardCandidatePositionRef.current = null;
        lastProgressEventAtRef.current = eventObservedAt;
        setIsPlaying(false);
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "resumed_with_new_baseline",
        );
        if (sessionIdRef.current && statusRef.current === "active") {
          void sendHeartbeat(snapshot, true);
        }
        return;
      }

      if (
        !playbackInitializedRef.current &&
        (!previousSnapshot ||
          previousSnapshot.isPaused ||
          previousSnapshot.isBuffering ||
          previousSnapshot.playingUri !== playingUri)
      ) {
        latestPlaybackRef.current = snapshot;
        lastAcceptedPlaybackAtRef.current = eventObservedAt;
        stablePlaybackUpdatesRef.current = 0;
        setIsPlaying(false);
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "startup_baseline",
        );
        return;
      }

      if (!previousSnapshot) {
        latestPlaybackRef.current = snapshot;
        lastAcceptedPlaybackAtRef.current = eventObservedAt;
        playbackInitializedRef.current = false;
        stablePlaybackUpdatesRef.current = 0;
        setIsPlaying(false);
        return;
      }

      const positionDeltaMs = positionMs - previousSnapshot.positionMs;

      if (!playbackInitializedRef.current) {
        latestPlaybackRef.current = snapshot;
        lastAcceptedPlaybackAtRef.current = eventObservedAt;

        if (
          positionDeltaMs <= 0 ||
          positionDeltaMs > MAX_NORMAL_POSITION_DELTA_MS
        ) {
          stablePlaybackUpdatesRef.current = 0;
          setIsPlaying(false);
          logPlaybackEvent(
            "playback_update",
            previousSnapshot,
            snapshot,
            positionDeltaMs <= 0
              ? "startup_correction_rebased"
              : "startup_jump_rebased",
          );
          return;
        }

        stablePlaybackUpdatesRef.current += 1;
        lastProgressEventAtRef.current = eventObservedAt;

        if (
          stablePlaybackUpdatesRef.current < STARTUP_STABLE_UPDATE_COUNT
        ) {
          setIsPlaying(false);
          logPlaybackEvent(
            "playback_update",
            previousSnapshot,
            snapshot,
            "startup_stabilizing",
          );
          return;
        }

        playbackInitializedRef.current = true;
        setIsPlaying(true);
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "startup_stable",
        );
        void ensureSession(snapshot);
        return;
      }

      if (positionDeltaMs === 0) {
        if (backwardCandidatePositionRef.current !== null) {
          backwardCandidatePositionRef.current = null;
        }
        logPlaybackEvent(
          "playback_update",
          previousSnapshot,
          snapshot,
          "duplicate_ignored",
        );
        return;
      }

      if (positionDeltaMs < 0) {
        if (Math.abs(positionDeltaMs) <= TINY_BACKWARD_CORRECTION_MS) {
          if (backwardCandidatePositionRef.current !== null) {
            backwardCandidatePositionRef.current = null;
          }
          logPlaybackEvent(
            "playback_update",
            previousSnapshot,
            snapshot,
            "tiny_backward_correction_ignored",
          );
          return;
        }

        const isRestartCandidate =
          positionMs <= CLEAR_RESTART_POSITION_MS &&
          previousSnapshot.positionMs >=
            CLEAR_RESTART_MIN_PREVIOUS_POSITION_MS;

        if (backwardCandidatePositionRef.current === null) {
          backwardCandidatePositionRef.current = positionMs;
          setIsPlaying(true);
          logPlaybackEvent(
            "playback_update",
            previousSnapshot,
            snapshot,
            isRestartCandidate
              ? "restart_candidate_ignored_once"
              : "backward_candidate_ignored_once",
          );
          return;
        }

        interruptListening(
          snapshot,
          true,
          isRestartCandidate ? "restart" : "backward_seek",
        );
        return;
      }

      backwardCandidatePositionRef.current = null;
      if (
        realElapsedMs !== null &&
        positionDeltaMs > realElapsedMs + FORWARD_SEEK_TOLERANCE_MS
      ) {
        interruptListening(
          snapshot,
          true,
          "forward_seek",
          eventTiming,
        );
        return;
      }

      latestPlaybackRef.current = snapshot;
      lastAcceptedPlaybackAtRef.current = eventObservedAt;
      lastProgressEventAtRef.current = eventObservedAt;
      setIsPlaying(true);

      if (!sessionIdRef.current || statusRef.current !== "active") {
        void ensureSession(snapshot);
        return;
      }

      const currentRequiredMs = requiredMsRef.current;
      const nextListenedMs = currentRequiredMs
        ? Math.min(
            continuousListenedMsRef.current + positionDeltaMs,
            currentRequiredMs,
          )
        : continuousListenedMsRef.current + positionDeltaMs;

      continuousListenedMsRef.current = nextListenedMs;
      setListenedMs(nextListenedMs);
      logPlaybackEvent(
        "playback_update",
        previousSnapshot,
        snapshot,
        "position_delta_counted",
      );

      if (currentRequiredMs && nextListenedMs >= currentRequiredMs) {
        void sendHeartbeat(snapshot);
      }
    },
    [
      ensureSession,
      interruptListening,
      logPlaybackEvent,
      mobileValidationDisabled,
      sendHeartbeat,
      spotifyUrl,
    ],
  );

  const resetListening = useCallback(() => {
    interruptListening(null, false, "manual_reset");
    playbackResetCountRef.current = 0;
    setShowPreviewHelp(false);
    setListeningError(null);
  }, [interruptListening]);

  useEffect(() => {
    if (mobileValidationDisabled) return;

    let cancelled = false;

    getListeningConfig()
      .then((result) => {
        if (cancelled) return;

        if (result.minDurationMs !== null) {
          requiredMsRef.current = result.minDurationMs;
          setRequiredMs(result.minDurationMs);
        }
        if (result.heartbeatIntervalMs !== null) {
          setHeartbeatIntervalMs(result.heartbeatIntervalMs);
        }
        if (!result.success && result.message) {
          setListeningError(result.message);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load listening configuration:", error);
          setListeningError("Listening verification is unavailable.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mobileValidationDisabled]);

  useEffect(() => {
    if (
      !heartbeatIntervalMs ||
      mobileValidationDisabled ||
      !sessionId ||
      listeningStatus !== "active" ||
      !isPlaying
    ) {
      return;
    }

    const heartbeatTimer = window.setInterval(() => {
      void sendHeartbeat();
    }, heartbeatIntervalMs);

    return () => window.clearInterval(heartbeatTimer);
  }, [
    heartbeatIntervalMs,
    isPlaying,
    listeningStatus,
    mobileValidationDisabled,
    sendHeartbeat,
    sessionId,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden ||
        mobileValidationDisabled ||
        statusRef.current === "completed" ||
        statusRef.current === "rewarded"
      ) {
        return;
      }

      const snapshot = latestPlaybackRef.current;
      interruptListening(snapshot, true, "page_hidden");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [interruptListening, mobileValidationDisabled]);

  useEffect(() => {
    const host = embedContainerRef.current;
    if (!spotifyUrl || !host) {
      return;
    }

    let cancelled = false;
    let localController: SpotifyEmbedController | null = null;

    host.replaceChildren();
    const spotifyMountPoint = document.createElement("div");
    host.appendChild(spotifyMountPoint);

    sessionIdRef.current = null;
    statusRef.current = null;
    latestPlaybackRef.current = null;
    lastHeartbeatPositionRef.current = null;
    continuousListenedMsRef.current = 0;
    playbackInitializedRef.current = false;
    stablePlaybackUpdatesRef.current = 0;
    resumeBaselinePendingRef.current = false;
    backwardCandidatePositionRef.current = null;
    lastAcceptedPlaybackAtRef.current = null;
    lastProgressEventAtRef.current = null;
    bufferingReportedRef.current = false;
    if (bufferingTimeoutRef.current !== null) {
      window.clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    playbackGenerationRef.current += 1;
    playbackResetCountRef.current = 0;
    setSessionId(null);
    setListeningStatus(null);
    setListenedMs(0);
    setListeningError(null);
    setShowPreviewHelp(false);
    setReady(false);
    setIsPlaying(false);

    const initialize = async () => {
      try {
        const iframeApi = await loadSpotifyIFrameAPI();
        if (cancelled) return;

        iframeApi.createController(
          spotifyMountPoint,
          {
            url: spotifyUrl,
            width: "100%",
            height: 152,
          },
          (controller) => {
            if (cancelled) {
              controller.destroy();
              return;
            }

            localController = controller;
            controller.addListener("ready", () => {
              if (!cancelled) {
                logPlaybackEvent(
                  "ready",
                  latestPlaybackRef.current,
                  latestPlaybackRef.current,
                  "player_ready",
                );
                setReady(true);
              }
            });
            controller.addListener("playback_started", (event) => {
              if (cancelled) return;

              const data = event.data;
              const eventPosition = Math.trunc(Number(data?.position));
              const eventPlayingUri = data?.playingURI;
              const eventSnapshot =
                Number.isFinite(eventPosition) &&
                eventPosition >= 0 &&
                typeof eventPlayingUri === "string"
                  ? {
                      positionMs: eventPosition,
                      isPaused: data?.isPaused !== false,
                      isBuffering: data?.isBuffering === true,
                      playingUri: eventPlayingUri,
                    }
                  : null;

              logPlaybackEvent(
                "playback_started",
                latestPlaybackRef.current,
                eventSnapshot,
                "observed",
              );
            });
            controller.addListener("playback_update", (event) => {
              if (!cancelled) handlePlaybackUpdate(event);
            });
          },
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Spotify initialization failed:", error);
          setListeningError("The Spotify player could not be initialized.");
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId && statusRef.current === "active") {
        queueSessionAbandon(currentSessionId);
      }
      if (bufferingTimeoutRef.current !== null) {
        window.clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
      playbackGenerationRef.current += 1;
      localController?.destroy();
      if (host.isConnected) {
        host.replaceChildren();
      }
    };
  }, [
    handlePlaybackUpdate,
    logPlaybackEvent,
    mobileValidationDisabled,
    queueSessionAbandon,
    spotifyUrl,
  ]);

  const isListeningComplete =
    listeningStatus === "completed" || listeningStatus === "rewarded";
  const progressPercent = requiredMs
    ? Math.min((listenedMs / requiredMs) * 100, 100)
    : 0;

  return {
    embedContainerRef,
    ready,
    isPlaying,
    listenedMs,
    requiredMs,
    progressPercent,
    isListeningComplete,
    listeningError,
    listeningStatus,
    sessionId,
    mobileValidationDisabled,
    showPreviewHelp,
    resetListening,
  };
}
