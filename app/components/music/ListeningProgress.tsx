import { Icon, ProgressBar } from "@/app/components/ui/design-system";

export function ListeningProgress({
  isPlaying,
  listenedMs,
  progressPercent,
  complete,
}: {
  isPlaying: boolean;
  listenedMs: number;
  progressPercent: number;
  complete: boolean;
}) {
  const listenedSeconds = Math.floor(listenedMs / 1000);
  const remainingSeconds = Math.max(0, 10 - listenedSeconds);

  return (
    <section className="rounded-card border border-border bg-background p-4">
      <ProgressBar
        value={progressPercent}
        tone={complete ? "success" : "coral"}
        label="Listen for 10 seconds"
        detail={`${listenedSeconds}s / 10s`}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`flex items-center gap-2 text-xs font-semibold ${complete ? "text-success" : "text-muted"}`}
        >
          <Icon
            name={complete ? "check" : isPlaying ? "headphones" : "play"}
            className="size-4"
          />
          {complete
            ? "Listening complete — feedback unlocked"
            : isPlaying
              ? `${remainingSeconds} seconds remaining`
              : listenedMs > 0
                ? `Paused · ${remainingSeconds} seconds remaining`
                : "Start playback in Spotify"}
        </p>
        {isPlaying && !complete && (
          <span className="flex items-end gap-0.5 text-coral" aria-hidden="true">
            <i className="h-2 w-0.5 animate-pulse bg-current" />
            <i className="h-4 w-0.5 animate-pulse bg-current" />
            <i className="h-3 w-0.5 animate-pulse bg-current" />
          </span>
        )}
      </div>
    </section>
  );
}
