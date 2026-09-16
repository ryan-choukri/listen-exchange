"use client";

import { useEffect, useState } from "react";
import { getUserSubmittedTracksCount } from "@/app/actions/submit";
import { Icon, Surface } from "@/app/components/ui/design-system";

export function UserTracksStats() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCount = async () => {
      setIsLoading(true);
      const tracksCount = await getUserSubmittedTracksCount();
      setCount(tracksCount);
      setIsLoading(false);
    };

    loadCount();
  }, []);

  return (
    <Surface className="p-4 shadow-none">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-blue-soft/40 text-blue-strong">
          <Icon name="music" />
        </span>
        <div>
          <p className="text-sm text-muted">Tracks You&apos;ve Submitted</p>
          <p className="text-2xl font-black text-ink">{isLoading ? "..." : count}</p>
        </div>
      </div>
    </Surface>
  );
}
