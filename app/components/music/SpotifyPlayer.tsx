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
}: {
  containerRef: Ref<HTMLDivElement>;
  ready: boolean;
  isPlaying: boolean;
  listenedMs: number;
  requiredMs: number | null;
  progressPercent: number;
  isListeningComplete: boolean;
  listeningError: string | null;
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
      <div className="mx-1 mt-2 rounded-control border border-white/15 bg-white/5 px-3 py-2 text-white">
        <p className="text-xs font-bold">Spotify Premium required</p>
        <p className="mt-0.5 text-[11px] italic leading-relaxed text-white/65">
          Premium is required to validate your listens and make sure your own
          tracks receive valid listens when you spend credits.
        </p>
        <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-white/75 sm:hidden">
          Make sure you&apos;re logged into Spotify in your browser, not only in
          the Spotify app.
        </p>
      </div>
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
    </div>
  );
}
