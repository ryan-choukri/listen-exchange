import { Badge, StatusBadge } from "@/app/components/ui/design-system";

export function TrackHeader({
  title,
  coverUrl,
  status,
  creditsRemaining,
}: {
  title: string;
  coverUrl: string;
  status?: string;
  creditsRemaining?: number;
}) {
  return (
    <header className="flex items-center gap-4">
      {/* Cover images come from Spotify-submitted track metadata. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt={`Cover art for ${title}`}
        className="size-20 shrink-0 rounded-control border border-border object-cover sm:size-24"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-strong">
          Now listening
        </p>
        <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="coral">Independent</Badge>
          {status === "active" || status === "pending" ? (
            <StatusBadge status={status} />
          ) : null}
          {typeof creditsRemaining === "number" && (
            <Badge tone="blue">
              {creditsRemaining} {creditsRemaining === 1 ? "credit" : "credits"} left
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
