"use client";

import { useState } from "react";
import {
  allocateTracksCredits,
  removeTracksCredits,
  getUserCredits,
} from "@/app/actions/credits";

interface CreditAllocationModalProps {
  trackId: string;
  trackTitle: string;
  currentCredits: number;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreditAllocationModal({
  trackId,
  trackTitle,
  currentCredits,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: CreditAllocationModalProps) {
  const [mode, setMode] = useState<"allocate" | "remove">("allocate");
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Load user balance when modal opens
  if (isOpen && userBalance === null && !isLoading) {
    (async () => {
      const balance = await getUserCredits();
      setUserBalance(balance);
    })();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const creditAmount = parseInt(amount, 10);

      if (isNaN(creditAmount) || creditAmount <= 0) {
        setError("Please enter a valid positive number");
        setIsLoading(false);
        return;
      }

      if (mode === "allocate") {
        // Allocate mode: check user balance
        if (userBalance !== null && creditAmount > userBalance) {
          setError(
            `Insufficient credits. You have ${userBalance} but need ${creditAmount}`,
          );
          setIsLoading(false);
          return;
        }

        const result = await allocateTracksCredits(trackId, creditAmount);

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.message || "Failed to allocate credits");
        }
      } else {
        // Remove mode: check track credits
        if (creditAmount > currentCredits) {
          setError(
            `Track has only ${currentCredits} credits but you want to remove ${creditAmount}`,
          );
          setIsLoading(false);
          return;
        }

        const result = await removeTracksCredits(trackId, creditAmount);

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.message || "Failed to remove credits");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const creditAmount = parseInt(amount, 10) || 0;
  const canAfford =
    mode === "allocate"
      ? userBalance !== null && creditAmount <= userBalance
      : creditAmount <= currentCredits;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full mx-4 p-6">
        {/* Header with Close */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Credits</h2>
            <p className="text-sm text-gray-400 mt-1">{trackTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Mode Toggle: Allocate / Remove */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setMode("allocate");
              setAmount("1");
              setError(null);
            }}
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded font-medium transition-colors ${
              mode === "allocate"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            } disabled:opacity-50`}
          >
            ➕ Allocate
          </button>
          <button
            onClick={() => {
              setMode("remove");
              setAmount("1");
              setError(null);
            }}
            disabled={isLoading || currentCredits === 0}
            className={`flex-1 px-3 py-2 rounded font-medium transition-colors ${
              mode === "remove"
                ? "bg-orange-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ➖ Remove
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded border border-gray-600">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400">Current Status</p>
              <p className="text-white font-semibold">
                {currentStatus === "active" ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Credits Remaining</p>
              <p className="text-white font-semibold">{currentCredits}</p>
            </div>
          </div>
        </div>

        {/* Balance Info (changes based on mode) */}
        {mode === "allocate" ? (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
            <p className="text-sm text-gray-400">Your Available Credits</p>
            <p className="text-white font-bold text-lg">
              {userBalance !== null ? userBalance : "Loading..."}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded">
            <p className="text-sm text-gray-400">Track Credits Available</p>
            <p className="text-white font-bold text-lg">{currentCredits}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-white mb-2"
            >
              {mode === "allocate"
                ? "Credits to Allocate"
                : "Credits to Remove"}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="amount"
                min="1"
                max={
                  mode === "allocate"
                    ? userBalance || 1000
                    : currentCredits || 1000
                }
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                className={`flex-1 px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 ${
                  mode === "allocate"
                    ? "border-gray-600 focus:border-green-500"
                    : "border-gray-600 focus:border-orange-500"
                }`}
                placeholder="Enter amount"
              />
              {/* Quick select buttons */}
              <div className="flex gap-1">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAmount(num.toString())}
                    disabled={isLoading}
                    className="px-2 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {mode === "allocate" ? "+" : "-"}
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {creditAmount > 0 && (
            <div className="p-3 bg-gray-700/50 rounded border border-gray-600">
              <div className="text-sm text-gray-400">
                {mode === "allocate" ? (
                  <>
                    <p className="flex justify-between mb-1">
                      <span>Your Balance:</span>
                      <span className="text-white font-semibold">
                        {userBalance} credits
                      </span>
                    </p>
                    <p className="flex justify-between mb-1">
                      <span>Will Allocate:</span>
                      <span className="text-green-400 font-semibold">
                        -{creditAmount}
                      </span>
                    </p>
                    <p className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                      <span>After Allocation:</span>
                      <span
                        className={`font-semibold ${
                          canAfford ? "text-white" : "text-red-400"
                        }`}
                      >
                        {userBalance !== null
                          ? userBalance - creditAmount
                          : "?"}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex justify-between mb-1">
                      <span>Track Credits:</span>
                      <span className="text-white font-semibold">
                        {currentCredits} credits
                      </span>
                    </p>
                    <p className="flex justify-between mb-1">
                      <span>Will Remove:</span>
                      <span className="text-orange-400 font-semibold">
                        -{creditAmount}
                      </span>
                    </p>
                    <p className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                      <span>After Removal:</span>
                      <span
                        className={`font-semibold ${
                          canAfford ? "text-white" : "text-red-400"
                        }`}
                      >
                        {currentCredits - creditAmount}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div
            className={`p-3 rounded border ${
              mode === "allocate"
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-orange-500/10 border-orange-500/30"
            }`}
          >
            <p
              className={`text-xs leading-relaxed ${
                mode === "allocate" ? "text-blue-300" : "text-orange-300"
              }`}
            >
              {mode === "allocate"
                ? "💡 Allocating credits will activate your track and enable listeners to earn credits by giving feedback. Once all credits are consumed, your track will move to pending status."
                : "💡 Removing credits will refund them to your balance. If the track reaches 0 credits, it will become inactive."}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !canAfford || creditAmount <= 0}
              className={`flex-1 px-4 py-2 border rounded text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "allocate"
                  ? "bg-green-600 hover:bg-green-700 border-green-600"
                  : "bg-orange-600 hover:bg-orange-700 border-orange-600"
              }`}
            >
              {isLoading
                ? mode === "allocate"
                  ? "Allocating..."
                  : "Removing..."
                : mode === "allocate"
                  ? "Allocate"
                  : "Remove"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
