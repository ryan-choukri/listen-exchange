"use client";

import { useState } from "react";
import {
  allocateTracksCredits,
  getUserCredits,
  removeTracksCredits,
} from "@/app/actions/credits";
import {
  Button,
  Modal,
  Notice,
  StatusBadge,
} from "@/app/components/ui/design-system";
import { announceCreditsUpdated } from "@/app/lib/credits-events";

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
  const [amount, setAmount] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  if (isOpen && userBalance === null && !isLoading) {
    (async () => {
      const balance = await getUserCredits();
      setUserBalance(balance);
    })();
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        if (userBalance !== null && creditAmount > userBalance) {
          setError(
            `Insufficient credits. You have ${userBalance} but need ${creditAmount}`,
          );
          setIsLoading(false);
          return;
        }

        const result = await allocateTracksCredits(trackId, creditAmount);
        if (result.success) {
          announceCreditsUpdated(result.credits_balance);
          onSuccess();
          onClose();
        } else {
          setError(result.message || "Failed to allocate credits");
        }
      } else {
        if (creditAmount > currentCredits) {
          setError(
            `Track has only ${currentCredits} credits but you want to remove ${creditAmount}`,
          );
          setIsLoading(false);
          return;
        }

        const result = await removeTracksCredits(trackId, creditAmount);
        if (result.success) {
          announceCreditsUpdated(result.credits_balance);
          onSuccess();
          onClose();
        } else {
          setError(result.message || "Failed to remove credits");
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const creditAmount = parseInt(amount, 10) || 0;
  const canAfford =
    mode === "allocate"
      ? userBalance !== null && creditAmount <= userBalance
      : creditAmount <= currentCredits;
  const sourceBalance = mode === "allocate" ? userBalance : currentCredits;
  const resultBalance =
    sourceBalance === null
      ? null
      : mode === "allocate"
        ? sourceBalance - creditAmount
        : sourceBalance - creditAmount;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Manage credits"
      description={trackTitle}
    >
      <div className="grid grid-cols-2 rounded-control bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => {
            setMode("allocate");
            setAmount("1");
            setError(null);
          }}
          disabled={isLoading}
          className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${mode === "allocate" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
        >
          + Allocate
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("remove");
            setAmount("1");
            setError(null);
          }}
          disabled={isLoading || currentCredits === 0}
          className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${mode === "remove" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
        >
          − Remove
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-control border border-border bg-background p-3">
          <p className="text-xs text-muted">Current status</p>
          <div className="mt-2">
            <StatusBadge
              status={currentStatus === "active" ? "active" : "pending"}
            />
          </div>
        </div>
        <div className="rounded-control border border-border bg-background p-3">
          <p className="text-xs text-muted">Credits remaining</p>
          <p className="mt-1 text-2xl font-black text-ink">{currentCredits}</p>
        </div>
      </div>

      <div className="mt-4 rounded-control border border-blue-strong/20 bg-blue-soft/25 p-3">
        <p className="text-xs text-blue-strong">
          {mode === "allocate" ? "Your available credits" : "Track credits available"}
        </p>
        <p className="mt-1 text-xl font-black text-ink">
          {mode === "allocate"
            ? userBalance !== null
              ? userBalance
              : "Loading…"
            : currentCredits}
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <Notice tone="danger" title="Credits could not be updated">
            {error}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-bold text-ink">
            Credits to {mode === "allocate" ? "allocate" : "remove"}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="amount"
              type="number"
              min="1"
              max={
                mode === "allocate"
                  ? userBalance || 1000
                  : currentCredits || 1000
              }
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isLoading}
              className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2.5 text-center text-lg font-black text-ink outline-none focus:border-blue-strong focus:ring-2 focus:ring-blue-soft disabled:bg-surface-muted"
            />
            <div className="flex gap-1">
              {[1, 5, 10].map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setAmount(number.toString())}
                  disabled={isLoading}
                  className="rounded-control border border-border bg-surface px-2.5 py-3 text-xs font-bold text-ink transition hover:border-ink disabled:opacity-50"
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {creditAmount > 0 && (
          <div className="rounded-control border border-border bg-background p-3 text-xs text-muted">
            <p className="flex justify-between gap-4">
              <span>{mode === "allocate" ? "Your balance" : "Track credits"}</span>
              <strong className="text-ink">{sourceBalance ?? "…"}</strong>
            </p>
            <p className="mt-1 flex justify-between gap-4">
              <span>{mode === "allocate" ? "Will allocate" : "Will remove"}</span>
              <strong className="text-coral-strong">−{creditAmount}</strong>
            </p>
            <p className="mt-2 flex justify-between gap-4 border-t border-border pt-2">
              <span>After the update</span>
              <strong className={canAfford ? "text-ink" : "text-danger"}>
                {resultBalance ?? "…"}
              </strong>
            </p>
          </div>
        )}

        <Notice tone="info" title="How credits work">
          {mode === "allocate"
            ? "Allocating credits activates the track so listeners can earn credits by giving feedback."
            : "Removed credits return to your balance. A track with zero credits becomes inactive."}
        </Notice>

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !canAfford || creditAmount <= 0}
            loading={isLoading}
            className="flex-1"
          >
            {mode === "allocate" ? "Allocate" : "Remove"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
