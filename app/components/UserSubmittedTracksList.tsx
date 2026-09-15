"use client";

import { useEffect, useState } from "react";
import {
  getUserSubmittedTracks,
  deleteSubmittedTrack,
} from "@/app/actions/submit";
import { CreditAllocationModal } from "./CreditAllocationModal";

interface SubmittedTrack {
  id: string;
  track_id: string;
  title: string;
  cover_url: string;
  created_at: string;
  credits_remaining: number;
  status: string;
}

interface UserSubmittedTracksListProps {
  refreshKey?: number;
  onTrackDeleted?: () => void; // Callback after successful deletion
}

export function UserSubmittedTracksList({
  refreshKey = 0,
  onTrackDeleted,
}: UserSubmittedTracksListProps) {
  const [tracks, setTracks] = useState<SubmittedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SubmittedTrack | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadTracks = async () => {
      setIsLoading(true);
      const userTracks = await getUserSubmittedTracks();
      setTracks(userTracks);
      setIsLoading(false);
    };

    loadTracks();
  }, [refreshKey]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);

    try {
      const result = await deleteSubmittedTrack(id);

      if (result.success) {
        // Remove from local state
        setTracks((prev) => prev.filter((track) => track.id !== id));
        // Call parent callback to refresh stats
        onTrackDeleted?.();
      } else {
        setDeleteError(result.message);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAllocateClick = (track: SubmittedTrack) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTrack(null);
  };

  const handleAllocationSuccess = () => {
    // Refresh tracks
    const loadTracks = async () => {
      const userTracks = await getUserSubmittedTracks();
      setTracks(userTracks);
    };
    loadTracks();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">Loading your tracks...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <p className="text-gray-400">No tracks submitted yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Submit your first track to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
        <h3 className="text-lg font-semibold">
          Your Submitted Tracks ({tracks.length})
        </h3>
      </div>

      {/* Error Message */}
      {deleteError && (
        <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-300 text-sm">{deleteError}</p>
        </div>
      )}

      {/* Tracks List */}
      <div className="divide-y divide-gray-700">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-700/30 transition-colors"
          >
            {/* Top Row: Cover + Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <img
                  src={track.cover_url}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{track.title}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(track.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Credits and Status Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Badge */}
              {track.status === "active" ? (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500 rounded text-green-300 text-xs font-medium">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-500/20 border border-gray-500 rounded text-gray-300 text-xs font-medium">
                  Pending
                </span>
              )}

              {/* Credits Display */}
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500 rounded text-blue-300 text-xs font-medium whitespace-nowrap">
                {track.credits_remaining} credits
              </span>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAllocateClick(track)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-600 rounded text-white text-sm font-medium transition-colors"
                >
                  Allocate
                </button>
                <button
                  onClick={() => handleDelete(track.id, track.title)}
                  disabled={deletingId === track.id}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === track.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Credit Allocation Modal */}
      {selectedTrack && (
        <CreditAllocationModal
          trackId={selectedTrack.id}
          trackTitle={selectedTrack.title}
          currentCredits={selectedTrack.credits_remaining}
          currentStatus={selectedTrack.status}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleAllocationSuccess}
        />
      )}
    </div>
  );
}
