import type { Ref } from "react";
import { Badge, Icon } from "@/app/components/ui/design-system";

export function SpotifyPlayer({
  containerRef,
  ready,
}: {
  containerRef: Ref<HTMLDivElement>;
  ready: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-ink/15 bg-spotify-surface p-2 shadow-card">
      <div className="mb-2 flex items-center justify-between px-1 text-white">
        <div className="flex items-center gap-2">
          <Icon name="spotify" className="size-4" />
          <span className="text-[11px] font-semibold">Official Spotify player</span>
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
    </div>
  );
}
