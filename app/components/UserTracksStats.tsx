"use client";

import { useEffect, useState } from "react";
import { getUserSubmittedTracksCount } from "@/app/actions/submit";

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
    <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎵</div>
        <div>
          <p className="text-sm text-gray-400">Tracks You've Submitted</p>
          <p className="text-2xl font-bold">{isLoading ? "..." : count}</p>
        </div>
      </div>
    </div>
  );
}
