"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const pauseReportedRef = useRef(false);
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

  const applyServerResult = useCallback((result: ListeningSessionResult) => {
    if (result.minDurationMs !== null) {
      setRequiredMs(result.minDurationMs);
    }
    if (result.heartbeatIntervalMs !== null) {
      setHeartbeatIntervalMs(result.heartbeatIntervalMs);
    }

    setListenedMs(Math.max(0, result.listenedMs));

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
      sessionIdRef.current = null;
      setSessionId(null);
      setIsPlaying(false);
    }
  }, []);

  const sendHeartbeat = useCallback(async (
    snapshotOverride?: PlaybackSnapshot,
    reportInactive = false,
  ) => {
    const currentSessionId = sessionIdRef.current;
    const snapshot = snapshotOverride ?? latestPlaybackRef.current;
    const inactive = Boolean(
      snapshot &&
        (snapshot.isPaused || snapshot.isBuffering || document.hidden),
    );

    if (
      !currentSessionId ||
      !snapshot ||
      heartbeatInFlightRef.current ||
      statusRef.current !== "active" ||
      (inactive && (!reportInactive || pauseReportedRef.current))
    ) {
      return;
    }

    if (
      !inactive &&
      lastHeartbeatPositionRef.current !== null &&
      snapshot.positionMs === lastHeartbeatPositionRef.current
    ) {
      setIsPlaying(false);
      return;
    }

    heartbeatInFlightRef.current = true;
    try {
      const result = await heartbeatListeningSession(
        currentSessionId,
        snapshot.positionMs,
        snapshot.isPaused || document.hidden,
        snapshot.isBuffering,
        snapshot.playingUri,
      );
      applyServerResult(result);

      if (result.success) {
        lastHeartbeatPositionRef.current = snapshot.positionMs;
        pauseReportedRef.current = inactive;
      }
    } catch (error) {
      console.error("Verified listening heartbeat failed:", error);
      setListeningError("Listening verification lost connection.");
    } finally {
      heartbeatInFlightRef.current = false;
    }
  }, [applyServerResult]);

  const ensureSession = useCallback(
    async (snapshot: PlaybackSnapshot) => {
      if (
        sessionIdRef.current ||
        startInFlightRef.current ||
        statusRef.current === "completed" ||
        statusRef.current === "rewarded"
      ) {
        return;
      }

      startInFlightRef.current = true;
      try {
        const result = await startListeningSession(
          submittedTrackId,
          snapshot.positionMs,
          snapshot.playingUri,
        );
        applyServerResult(result);

        if (result.success && result.status === "active") {
          lastHeartbeatPositionRef.current = snapshot.positionMs;

          const latestSnapshot = latestPlaybackRef.current;
          if (
            latestSnapshot &&
            (latestSnapshot.isPaused ||
              latestSnapshot.isBuffering ||
              document.hidden)
          ) {
            void sendHeartbeat(latestSnapshot, true);
          }
        }
      } catch (error) {
        console.error("Unable to start verified listening:", error);
        setListeningError("The verified listening session could not start.");
      } finally {
        startInFlightRef.current = false;
      }
    },
    [applyServerResult, sendHeartbeat, submittedTrackId],
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

      const previousSnapshot = latestPlaybackRef.current;
      latestPlaybackRef.current = snapshot;
      const hasRealProgress = Boolean(
        previousSnapshot &&
          previousSnapshot.playingUri === playingUri &&
          positionMs > previousSnapshot.positionMs &&
          !isPaused &&
          !isBuffering &&
          !document.hidden,
      );

      setIsPlaying(hasRealProgress);

      if (hasRealProgress) {
        pauseReportedRef.current = false;
        void ensureSession(snapshot);
      } else if (isPaused || isBuffering || document.hidden) {
        void sendHeartbeat(snapshot, true);
      }
    },
    [ensureSession, sendHeartbeat],
  );

  const resetListening = useCallback(() => {
    const currentSessionId = sessionIdRef.current;
    if (currentSessionId && statusRef.current === "active") {
      void abandonListeningSession(currentSessionId);
    }

    sessionIdRef.current = null;
    statusRef.current = null;
    latestPlaybackRef.current = null;
    lastHeartbeatPositionRef.current = null;
    pauseReportedRef.current = false;
    setSessionId(null);
    setListeningStatus(null);
    setListenedMs(0);
    setListeningError(null);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getListeningConfig()
      .then((result) => {
        if (cancelled) return;

        if (result.minDurationMs !== null) {
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
  }, []);

  useEffect(() => {
    if (
      !heartbeatIntervalMs ||
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
    sendHeartbeat,
    sessionId,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) return;

      setIsPlaying(false);
      const snapshot = latestPlaybackRef.current;
      if (snapshot) {
        void sendHeartbeat(snapshot, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sendHeartbeat]);

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
    pauseReportedRef.current = false;
    setSessionId(null);
    setListeningStatus(null);
    setListenedMs(0);
    setListeningError(null);
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
              if (!cancelled) setReady(true);
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
      localController?.destroy();
      if (host.isConnected) {
        host.replaceChildren();
      }
    };
  }, [handlePlaybackUpdate, spotifyUrl]);

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
    resetListening,
  };
}
