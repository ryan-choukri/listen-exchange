"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  claimOwnerListenNotification,
  type ListenNotification,
} from "@/app/actions/listen-notifications";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";
import { Icon } from "@/app/components/ui/design-system";

const CHECK_INTERVAL_MS = 5 * 60 * 1_000;
const TOAST_DURATION_MS = 8_000;
const lastCheckByUser = new Map<string, number>();

interface DisplayedListenNotification extends ListenNotification {
  userId: string;
}

export function ListenNotificationToast() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const userId = user?.id ?? null;
  const [notification, setNotification] =
    useState<DisplayedListenNotification | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!userId) return;

    const checkedAt = Date.now();
    const previousCheck = lastCheckByUser.get(userId) ?? 0;

    if (checkedAt - previousCheck < CHECK_INTERVAL_MS) {
      return;
    }

    // Record the attempt before starting it so React Strict Mode, rapid route
    // changes, and multiple mounted shells cannot trigger parallel claims.
    lastCheckByUser.set(userId, checkedAt);
    const checkedUserId = userId;

    void claimOwnerListenNotification().then((claimedNotification) => {
      if (claimedNotification) {
        setNotification({ ...claimedNotification, userId: checkedUserId });
      }
    });
  }, [isLoading, pathname, userId]);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(
      () => setNotification(null),
      TOAST_DURATION_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  if (!notification || notification.userId !== userId) {
    return null;
  }

  const hasSingleTrack =
    notification.trackCount === 1 && Boolean(notification.trackTitle);
  const listenLabel = notification.listenCount === 1 ? "listen" : "listens";

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[65] flex justify-center lg:inset-x-auto lg:right-6 lg:bottom-6">
      <div
        className="listen-notification-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-lime-strong/50 bg-surface/95 p-4 pr-3 text-ink shadow-highlight backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-on-accent shadow-raised">
          <Icon name="spotify" className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold tracking-tight">
            +{notification.listenCount} real Spotify {listenLabel}
          </p>
          <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
            {hasSingleTrack ? (
              <>
                <span className="font-semibold text-ink">
                  “{notification.trackTitle}”
                </span>{" "}
                is getting discovered by real artists.
              </>
            ) : (
              "Your music is getting discovered by real artists."
            )}
          </p>
        </div>

        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-strong"
          onClick={() => setNotification(null)}
          aria-label="Dismiss listen notification"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>
    </div>
  );
}
