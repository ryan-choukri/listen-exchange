import { Icon, ProgressBar } from "@/app/components/ui/design-system";

export function ListeningProgress({
  isPlaying,
  listenedMs,
  requiredMs,
  progressPercent,
  complete,
  error,
}: {
  isPlaying: boolean;
  listenedMs: number;
  requiredMs: number | null;
  progressPercent: number;
  complete: boolean;
  error: string | null;
}) {
  const listenedSeconds = Math.floor(listenedMs / 1000);
  const requiredSeconds = requiredMs ? Math.ceil(requiredMs / 1000) : null;
  const remainingSeconds = requiredMs
    ? Math.max(0, Math.ceil((requiredMs - listenedMs) / 1000))
    : null;

  return (
    <section className="rounded-card border border-border bg-background p-2">
      <ProgressBar
        value={progressPercent}
        tone={complete ? "success" : "coral"}
        label={
          requiredSeconds
            ? `Listen for ${requiredSeconds} seconds`
            : "Loading verification rules…"
        }
        detail={
          requiredSeconds ? `${listenedSeconds}s / ${requiredSeconds}s` : "—"
        }
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`flex items-center gap-2 text-xs font-semibold ${
            complete ? "text-success" : error ? "text-danger" : "text-muted"
          }`}
        >
          <Icon
            name={
              complete
                ? "check"
                : error
                  ? "alert"
                  : isPlaying
                    ? "headphones"
                    : "play"
            }
            className="size-4"
          />
          {complete
            ? "Listening complete — feedback unlocked"
            : error
              ? error
              : isPlaying
                ? `${remainingSeconds ?? "—"} seconds remaining`
                : listenedMs > 0
                  ? `Paused · ${remainingSeconds ?? "—"} seconds remaining`
                  : "Start playback in Spotify"}
        </p>
        {isPlaying && !complete && (
          <span
            className="flex items-end gap-0.5 text-coral"
            aria-hidden="true"
          >
            <i className="h-2 w-0.5 animate-pulse bg-current" />
            <i className="h-4 w-0.5 animate-pulse bg-current" />
            <i className="h-3 w-0.5 animate-pulse bg-current" />
          </span>
        )}
      </div>
    </section>
  );
}
