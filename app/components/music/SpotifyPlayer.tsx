import type { Ref } from "react";
import { Badge, Icon } from "@/app/components/ui/design-system";
import { ListeningProgress } from "./ListeningProgress";

export function SpotifyPlayer({
  containerRef,
  ready,
  isPlaying,
  listenedMs,
  requiredMs,
  progressPercent,
  isListeningComplete,
  listeningError,
  mobileValidationDisabled,
  showPreviewHelp,
}: {
  containerRef: Ref<HTMLDivElement>;
  ready: boolean;
  isPlaying: boolean;
  listenedMs: number;
  requiredMs: number | null;
  progressPercent: number;
  isListeningComplete: boolean;
  listeningError: string | null;
  mobileValidationDisabled: boolean;
  showPreviewHelp: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-spotify-surface p-2 shadow-card">
      <div className="mb-2 flex items-center justify-between px-1 text-white">
        <div className="flex items-center gap-2">
          <Icon name="spotify" className="size-4" />
          <span className="text-[11px] font-semibold">
            Official Spotify player
          </span>
        </div>
        <Badge className="border-white/20 bg-white/10 py-0.5 text-white">
          Embed
        </Badge>
      </div>
      <div className="relative min-h-[152px]">
        <div ref={containerRef} className="min-h-[152px]" />
        {!ready && (
          <div className="absolute inset-0 grid min-h-[152px] place-items-center rounded-control bg-spotify-surface text-center text-white/60">
            <div>
              <span className="mx-auto block size-5 animate-spin rounded-full border-2 border-white/60 border-r-transparent" />
              <p className="mt-3 text-xs">Loading Spotify player…</p>
            </div>
          </div>
        )}
      </div>
      {mobileValidationDisabled ? (
        <div className="mx-1 mt-2 rounded-control border border-blue-strong/35 bg-blue-soft/10 px-3 py-2.5 text-white">
          <p className="text-xs font-bold">
            Desktop required for validated listens
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/70">
            Spotify mobile embeds may only play a preview, which cannot be
            reliably validated as a Spotify stream. Please use a desktop
            browser with Spotify Premium to earn credits.
          </p>
        </div>
      ) : (
        <>
          {showPreviewHelp ? (
            <div className="mx-1 mt-2 rounded-control border border-coral/35 bg-coral/10 px-3 py-2 text-white">
              <p className="text-[11px] leading-relaxed text-white/80">
                Playback was interrupted. Make sure you&apos;re logged into
                Spotify Premium and the Spotify player is not showing a
                preview.
              </p>
            </div>
          ) : null}

          <div className="mx-1 mt-2 rounded-control border border-white/15 bg-white/5 px-3 py-2 text-white">
            <p className="text-xs font-bold">Spotify Premium required</p>
            <p className="mt-0.5 text-[11px] italic leading-relaxed text-white/65">
              Make sure you&apos;re logged into Spotify Premium and that the
              player is playing the full track, not showing a &quot;Preview&quot;
              experience.
            </p>
          </div>

          <p className="mx-2 mt-2 text-[10px] leading-relaxed text-white/55">
            The embedded Spotify player may not recognize your Premium session
            if third-party cookies are blocked. If you only see a preview,
            allow third-party cookies for Spotify and reload the page.
          </p>

          <div className="mt-2">
            <ListeningProgress
              isPlaying={isPlaying}
              listenedMs={listenedMs}
              requiredMs={requiredMs}
              progressPercent={progressPercent}
              complete={isListeningComplete}
              error={listeningError}
            />
          </div>
        </>
      )}
    </div>
  );
}
