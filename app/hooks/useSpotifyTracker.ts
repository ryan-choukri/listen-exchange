"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TARGET_MS = 10_000;

interface SpotifyEmbedController {
  addListener(
    event: "ready" | "playback_started" | "playback_update",
    callback: (event: any) => void,
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

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;

    __spotifyIframeAPI?: SpotifyIFrameAPI;

    __spotifyIframePromise?: Promise<SpotifyIFrameAPI>;
  }
}

const SCRIPT_ID = "spotify-iframe-api";

const SCRIPT_URL = "https://open.spotify.com/embed/iframe-api/v1";

/**
 * Charge l'API UNE SEULE FOIS.
 *
 * Ensuite on garde nous-mêmes IFrameAPI en mémoire,
 * car Spotify ne rappelle pas forcément
 * onSpotifyIframeApiReady après une navigation Next.
 */
function loadSpotifyIFrameAPI(): Promise<SpotifyIFrameAPI> {
  if (window.__spotifyIframeAPI) {
    console.log("♻️ Spotify API already cached");

    return Promise.resolve(window.__spotifyIframeAPI);
  }

  if (window.__spotifyIframePromise) {
    console.log("⏳ Spotify API already loading");

    return window.__spotifyIframePromise;
  }

  window.__spotifyIframePromise = new Promise<SpotifyIFrameAPI>(
    (resolve, reject) => {
      window.onSpotifyIframeApiReady = (api) => {
        console.log("✅ Spotify IFrameAPI received");

        // IMPORTANT :
        // on garde la référence nous-mêmes.
        window.__spotifyIframeAPI = api;

        resolve(api);
      };

      let existingScript = document.getElementById(SCRIPT_ID);

      /*
       * Cas développement / Hot Reload :
       *
       * le script peut déjà être présent
       * alors que notre cache n'existe pas.
       *
       * On le recharge.
       */
      if (existingScript) {
        console.log(
          "♻️ Spotify script exists but API isn't cached — reloading script",
        );

        existingScript.remove();
        existingScript = null;
      }

      const script = document.createElement("script");

      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;

      script.onerror = () => {
        console.error("❌ Spotify API script failed");

        window.__spotifyIframePromise = undefined;

        reject(new Error("Spotify iframe API failed to load"));
      };

      document.body.appendChild(script);

      console.log("📥 Spotify iframe script added");
    },
  );

  return window.__spotifyIframePromise;
}

export function useSpotifyTracker(spotifyUrl: string) {
  /*
   * IMPORTANT :
   *
   * React garde ce DIV.
   *
   * Spotify ne remplacera PAS directement
   * ce DIV. On créera un enfant dedans.
   */
  const embedContainerRef = useRef<HTMLDivElement>(null);

  const controllerRef = useRef<SpotifyEmbedController | null>(null);

  const [listenedMs, setListenedMs] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const [ready, setReady] = useState(false);

  const lastPositionRef = useRef<number | null>(null);

  const lastTimestampRef = useRef<number | null>(null);

  const resetListening = useCallback(() => {
    setListenedMs(0);
    setIsPlaying(false);

    lastPositionRef.current = null;

    lastTimestampRef.current = null;
  }, []);

  const handlePlaybackUpdate = useCallback((event: any) => {
    const { position, isPaused, isBuffering, playingURI } = event.data;

    const now = Date.now();

    if (isPaused || isBuffering) {
      setIsPlaying(false);

      lastPositionRef.current = position;

      lastTimestampRef.current = now;

      return;
    }

    setIsPlaying(true);

    const previousPosition = lastPositionRef.current;

    const previousTimestamp = lastTimestampRef.current;

    if (previousPosition !== null && previousTimestamp !== null) {
      const positionDelta = position - previousPosition;

      const realTimeDelta = now - previousTimestamp;

      /*
       * Protection basique contre le seek :
       *
       * la position Spotify doit avancer
       * globalement au même rythme
       * que le vrai temps.
       */
      const validPlayback =
        positionDelta > 0 &&
        realTimeDelta > 0 &&
        positionDelta <= realTimeDelta + 1500 &&
        realTimeDelta < 5000;

      if (validPlayback && !document.hidden) {
        const validMs = Math.min(positionDelta, realTimeDelta);

        setListenedMs((current) => Math.min(current + validMs, TARGET_MS));
      }
    }

    lastPositionRef.current = position;

    lastTimestampRef.current = now;

    console.log("🎵 playback_update", {
      playingURI,
      position,
      isPaused,
      isBuffering,
    });
  }, []);

  useEffect(() => {
    const host = embedContainerRef.current;

    if (!spotifyUrl || !host) {
      return;
    }

    console.log("🚀 Spotify mount:", spotifyUrl);

    let cancelled = false;

    let localController: SpotifyEmbedController | null = null;

    /*
     * Nettoyage d'un éventuel ancien player.
     */
    host.replaceChildren();

    /*
     * Spotify va remplacer CE div,
     * pas notre host React.
     */
    const spotifyMountPoint = document.createElement("div");

    host.appendChild(spotifyMountPoint);

    setReady(false);
    setIsPlaying(false);
    setListenedMs(0);

    lastPositionRef.current = null;

    lastTimestampRef.current = null;

    const initialize = async () => {
      try {
        const IFrameAPI = await loadSpotifyIFrameAPI();

        /*
         * Le user a pu changer de page
         * pendant le chargement.
         */
        if (cancelled) {
          console.log("⚠️ Component gone before Spotify API loaded");

          return;
        }

        console.log("🎯 Creating Spotify controller:", spotifyUrl);

        IFrameAPI.createController(
          spotifyMountPoint,
          {
            url: spotifyUrl,
            width: "100%",
            height: 152,
          },
          (controller) => {
            /*
             * createController est async-ish :
             * navigation possible entre temps.
             */
            if (cancelled) {
              console.log("⚠️ Controller created after unmount — destroying");

              controller.destroy();

              return;
            }

            console.log("✅ Spotify controller created");

            localController = controller;

            controllerRef.current = controller;

            controller.addListener("ready", () => {
              if (cancelled) return;

              console.log("✅ Spotify embed ready");

              setReady(true);
            });

            controller.addListener("playback_started", (event) => {
              if (cancelled) return;

              console.log("▶️ Playback started:", event.data.playingURI);

              setIsPlaying(true);
            });

            controller.addListener("playback_update", (event) => {
              if (cancelled) return;

              handlePlaybackUpdate(event);
            });
          },
        );
      } catch (error) {
        if (!cancelled) {
          console.error("❌ Spotify initialization error:", error);
        }
      }
    };

    initialize();

    return () => {
      console.log("🧹 Spotify component unmount");

      cancelled = true;

      /*
       * On détruit LE PLAYER.
       *
       * Mais on ne détruit PAS IFrameAPI :
       * elle reste dans window.__spotifyIframeAPI.
       */
      if (localController) {
        localController.destroy();

        localController = null;
      }

      controllerRef.current = null;

      /*
       * Évite de toucher au DOM
       * s'il a déjà disparu.
       */
      if (host.isConnected) {
        host.replaceChildren();
      }
    };
  }, [spotifyUrl, handlePlaybackUpdate]);

  return {
    embedContainerRef,
    ready,
    isPlaying,
    listenedMs,
    resetListening,

    hasReached60Seconds: listenedMs >= TARGET_MS,

    progressPercent: Math.min(listenedMs / TARGET_MS, 1) * 100,
  };
}
