"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getOnboardingState } from "@/app/actions/onboarding";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";
import { Icon } from "@/app/components/ui/design-system";
import {
  getOnboardingStorageKey,
  isOnboardingEligible,
  ONBOARDING_PREVIEW_READY_EVENT,
  ONBOARDING_STATE_CHANGED_EVENT,
  type OnboardingStep,
  type StoredOnboardingProgress,
} from "@/app/lib/onboarding";

const STEP_CONTENT: Record<
  OnboardingStep,
  {
    title: string;
    supportingTitle?: string;
    description: string;
    secondaryDescription?: string;
    target: string;
    action: string;
  }
> = {
  1: {
    title: "Start here",
    description: "Add your Spotify track. You already have 2 free listens.",
    target: "submit-track",
    action: "Add track",
  },
  2: {
    title: "Add your track",
    description:
      "Choose a genre for your track, then add it to ListenExchange.",
    target: "add-track",
    action: "Choose a genre",
  },
  3: {
    title: "Use your free listens",
    description:
      "Add at least 1 of your free listens to make this track discoverable.",
    target: "allocate-track",
    action: "Allocate",
  },
  4: {
    title: "DON’T LEAVE NOW!",
    supportingTitle: "Get listens for your Spotify track",
    description:
      "You’re one step away from earning real Spotify listens for your own music.",
    secondaryDescription:
      "Listen to tracks, leave feedback, and start getting listens back.",
    target: "discover-navigation",
    action: "Get my listens",
  },
};

interface Point {
  x: number;
  y: number;
}

interface CoachLayout {
  cardLeft: number;
  cardTop: number;
  arrowStart: Point;
  arrowControl: Point;
  arrowEnd: Point;
}

function readStoredProgress(userId: string): StoredOnboardingProgress | null {
  try {
    const value = window.localStorage.getItem(getOnboardingStorageKey(userId));
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<StoredOnboardingProgress>;
    if (
      !["active", "skipped", "completed"].includes(parsed.status ?? "") ||
      ![1, 2, 3, 4].includes(parsed.highestStep ?? 0)
    ) {
      return null;
    }

    return parsed as StoredOnboardingProgress;
  } catch {
    return null;
  }
}

function writeStoredProgress(
  userId: string,
  progress: StoredOnboardingProgress,
) {
  try {
    window.localStorage.setItem(
      getOnboardingStorageKey(userId),
      JSON.stringify(progress),
    );
  } catch {
    // The tour remains usable when storage is unavailable; it simply will not persist.
  }
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function parseDebugStep(value: string | null): OnboardingStep | null {
  return value === "1" || value === "2" || value === "3" || value === "4"
    ? (Number(value) as OnboardingStep)
    : null;
}

function calculateLayout(
  targetRect: DOMRect,
  cardRect: DOMRect,
  placement: "auto" | "below" = "auto",
  arrowEndOffsetX = 0,
): CoachLayout {
  const gutter = 18;
  const arrowGap = 30;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = cardRect.width || Math.min(292, viewportWidth - gutter * 2);
  const cardHeight = cardRect.height || 190;
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  };

  let cardLeft: number;
  let cardTop: number;

  if (placement === "below") {
    cardLeft = targetCenter.x - cardWidth / 2;
    cardTop = targetRect.bottom + arrowGap;
  } else if (viewportWidth < 640) {
    cardLeft = clamp(
      (viewportWidth - cardWidth) / 2,
      gutter,
      viewportWidth - cardWidth - gutter,
    );
    cardTop =
      targetCenter.y > viewportHeight * 0.56
        ? targetRect.top - cardHeight - arrowGap
        : targetRect.bottom + arrowGap;
  } else {
    cardLeft = targetCenter.x - cardWidth / 2;
    cardTop = targetRect.top - cardHeight - arrowGap;

    if (
      cardTop < gutter &&
      targetRect.left < viewportWidth * 0.3 &&
      viewportWidth - targetRect.right >= cardWidth + arrowGap
    ) {
      cardLeft = targetRect.right + arrowGap;
      cardTop = gutter;
    } else if (cardTop < gutter) {
      cardTop = targetRect.bottom + arrowGap;
    }
  }

  cardLeft = clamp(cardLeft, gutter, viewportWidth - cardWidth - gutter);
  cardTop = clamp(cardTop, gutter, viewportHeight - cardHeight - gutter);

  const cardCenter = {
    x: cardLeft + cardWidth / 2,
    y: cardTop + cardHeight / 2,
  };
  const arrowTarget = {
    x: clamp(
      targetCenter.x + arrowEndOffsetX,
      targetRect.left + 8,
      targetRect.right - 8,
    ),
    y: targetCenter.y,
  };
  const deltaX = arrowTarget.x - cardCenter.x;
  const deltaY = arrowTarget.y - cardCenter.y;
  const edgeScale =
    1 /
    Math.max(
      Math.abs(deltaX) / Math.max(cardWidth / 2, 1),
      Math.abs(deltaY) / Math.max(cardHeight / 2, 1),
      1,
    );
  const arrowStart = {
    x: cardCenter.x + deltaX * edgeScale,
    y: cardCenter.y + deltaY * edgeScale,
  };
  const distance = Math.hypot(deltaX, deltaY);
  const bend = clamp(distance * 0.12, 18, 46);
  const direction = arrowTarget.x >= cardCenter.x ? 1 : -1;
  const arrowControl = {
    x: (arrowStart.x + arrowTarget.x) / 2 -
      ((arrowTarget.y - arrowStart.y) / Math.max(distance, 1)) * bend * direction,
    y: (arrowStart.y + arrowTarget.y) / 2 +
      ((arrowTarget.x - arrowStart.x) / Math.max(distance, 1)) * bend * direction,
  };

  return {
    cardLeft,
    cardTop,
    arrowStart,
    arrowControl,
    arrowEnd: arrowTarget,
  };
}

export function OnboardingCoachMarks() {
  const { user, isLoading } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugStep =
    pathname === "/submit" ? parseDebugStep(searchParams.get("step")) : null;
  const cardRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [layout, setLayout] = useState<CoachLayout | null>(null);
  const [hasOpenModal, setHasOpenModal] = useState(false);

  const refreshState = useCallback(async () => {
    if (debugStep) {
      setStep(debugStep);
      return;
    }

    if (!user || !isOnboardingEligible(user.createdAt)) {
      setStep(null);
      return;
    }

    const stored = readStoredProgress(user.id);
    if (stored?.status === "skipped" || stored?.status === "completed") {
      setStep(null);
      return;
    }

    const state = await getOnboardingState();
    if (!state.eligible || !state.step) {
      setStep(null);
      return;
    }

    const previewIsReady =
      state.step === 1 &&
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-onboarding-target="add-track"]',
        ),
      ).some(isVisible);
    const resolvedStep: OnboardingStep = previewIsReady ? 2 : state.step;

    const highestStep = Math.max(
      resolvedStep,
      stored?.highestStep ?? 1,
    ) as OnboardingStep;

    writeStoredProgress(user.id, { status: "active", highestStep });
    setStep(resolvedStep);
  }, [debugStep, user]);

  const promoteToPreviewStep = useCallback(() => {
    if (debugStep) return;
    if (!user || step !== 1 || !isOnboardingEligible(user.createdAt)) return;

    const stored = readStoredProgress(user.id);
    if (stored?.status === "skipped" || stored?.status === "completed") return;

    writeStoredProgress(user.id, { status: "active", highestStep: 2 });
    setStep(2);
  }, [debugStep, step, user]);

  useEffect(() => {
    if (isLoading) return;

    const initialRefresh = window.setTimeout(() => void refreshState(), 0);
    window.addEventListener(ONBOARDING_STATE_CHANGED_EVENT, refreshState);
    window.addEventListener("focus", refreshState);

    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(ONBOARDING_STATE_CHANGED_EVENT, refreshState);
      window.removeEventListener("focus", refreshState);
    };
  }, [isLoading, refreshState]);

  useEffect(() => {
    if (isLoading) return;

    window.addEventListener(
      ONBOARDING_PREVIEW_READY_EVENT,
      promoteToPreviewStep,
    );

    return () => {
      window.removeEventListener(
        ONBOARDING_PREVIEW_READY_EVENT,
        promoteToPreviewStep,
      );
    };
  }, [isLoading, promoteToPreviewStep]);

  useEffect(() => {
    if (!step) return;

    if (step === 1 && pathname !== "/submit") {
      router.replace("/submit");
    }

    if (step === 3 && pathname !== "/submit" && pathname !== "/my-tracks") {
      router.replace("/my-tracks");
    }
  }, [pathname, router, step]);

  useEffect(() => {
    if (!step) return;

    const selector = `[data-onboarding-target="${STEP_CONTENT[step].target}"]`;
    const findTarget = () => {
      if (!debugStep && step === 1) {
        const previewTarget = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-onboarding-target="add-track"]',
          ),
        ).find(isVisible);

        if (previewTarget) {
          window.setTimeout(promoteToPreviewStep, 0);
          return;
        }
      }

      const nextTarget = Array.from(
        document.querySelectorAll<HTMLElement>(selector),
      ).find(isVisible);
      setTargetElement((current) =>
        current === nextTarget ? current : (nextTarget ?? null),
      );
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", findTarget);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", findTarget);
    };
  }, [debugStep, pathname, promoteToPreviewStep, step]);

  useEffect(() => {
    if (step !== 2 || !targetElement) return;

    const scrollTimer = window.setTimeout(() => {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);

    return () => window.clearTimeout(scrollTimer);
  }, [step, targetElement]);

  useEffect(() => {
    const syncModalState = () => {
      setHasOpenModal(
        Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
      );
    };
    const initialSync = window.setTimeout(syncModalState, 0);
    const observer = new MutationObserver(syncModalState);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(initialSync);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!targetElement || !step || hasOpenModal) return;
    if (
      targetElement.dataset.onboardingTarget !== STEP_CONTENT[step].target
    ) {
      return;
    }

    const accent = step === 4 ? "var(--lime)" : "var(--coral)";
    targetElement.classList.add("onboarding-target-active");
    targetElement.style.setProperty("--onboarding-accent", accent);

    const completeFromNavigation = () => {
      if (debugStep || step !== 4 || !user) return;
      writeStoredProgress(user.id, { status: "completed", highestStep: 4 });
      setStep(null);
    };
    targetElement.addEventListener("click", completeFromNavigation);

    return () => {
      targetElement.classList.remove("onboarding-target-active");
      targetElement.style.removeProperty("--onboarding-accent");
      targetElement.removeEventListener("click", completeFromNavigation);
    };
  }, [debugStep, hasOpenModal, step, targetElement, user]);

  useLayoutEffect(() => {
    if (
      !targetElement ||
      !cardRef.current ||
      !step ||
      targetElement.dataset.onboardingTarget !== STEP_CONTENT[step].target
    ) {
      setLayout(null);
      return;
    }

    let frame = 0;
    const updateLayout = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!cardRef.current || !isVisible(targetElement)) return;
        setLayout(
          calculateLayout(
            targetElement.getBoundingClientRect(),
            cardRef.current.getBoundingClientRect(),
            step === 2 ? "below" : "auto",
            step === 4 ? 28 : 0,
          ),
        );
      });
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(targetElement);
    resizeObserver.observe(cardRef.current);
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [hasOpenModal, targetElement, step]);

  if (
    !mounted ||
    !user ||
    !step ||
    !targetElement ||
    targetElement.dataset.onboardingTarget !== STEP_CONTENT[step].target ||
    hasOpenModal
  ) {
    return null;
  }

  const content = STEP_CONTENT[step];
  const accent = step === 4 ? "var(--lime)" : "var(--coral)";
  const arrowPath = layout
    ? `M ${layout.arrowStart.x} ${layout.arrowStart.y} Q ${layout.arrowControl.x} ${layout.arrowControl.y} ${layout.arrowEnd.x} ${layout.arrowEnd.y}`
    : "";

  const handleSkip = () => {
    if (debugStep) {
      setStep(null);
      return;
    }

    writeStoredProgress(user.id, { status: "skipped", highestStep: step });
    setStep(null);
  };

  const handleAction = () => {
    if (step === 4) {
      if (!debugStep) {
        writeStoredProgress(user.id, { status: "completed", highestStep: 4 });
        setStep(null);
      }
      router.push("/discover");
      return;
    }

    if (step === 3) {
      targetElement.click();
      return;
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!targetElement.hasAttribute("disabled")) {
      window.setTimeout(() => targetElement.focus({ preventScroll: true }), 350);
    }
  };

  return createPortal(
    <>
      {layout && (
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[79] size-full overflow-visible"
        >
          <defs>
            <marker
              id={`onboarding-arrowhead-${step}`}
              markerWidth="7"
              markerHeight="7"
              refX="5.5"
              refY="3.5"
              orient="auto"
            >
              <path d="M 0 0 L 7 3.5 L 0 7" fill="none" stroke={accent} />
            </marker>
          </defs>
          <path
            key={`${step}-${pathname}`}
            d={arrowPath}
            pathLength="1"
            markerEnd={`url(#onboarding-arrowhead-${step})`}
            className="onboarding-arrow-path"
            fill="none"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-label={`Onboarding step ${step} of 4: ${content.title}`}
        className={`fixed z-[80] w-[min(18.25rem,calc(100vw-2.25rem))] rounded-card border bg-surface/95 p-4 text-ink backdrop-blur-xl transition-opacity duration-200 sm:p-5 ${step === 4 ? "shadow-highlight" : "shadow-card"}`}
        style={{
          left: layout?.cardLeft ?? 18,
          top: layout?.cardTop ?? 18,
          borderColor: accent,
          opacity: layout ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted">
            {step} / 4
          </span>
          <span
            className="h-1.5 w-12 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
        </div>
        <h2
          className={`mt-3 font-black tracking-tight ${step === 4 ? "text-2xl leading-none" : "text-xl"}`}
        >
          {content.title}
        </h2>
        {content.supportingTitle ? (
          <p className="mt-2 text-base font-black leading-5 text-ink">
            {content.supportingTitle}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-5 text-muted">
          {content.description}
        </p>
        {content.secondaryDescription ? (
          <p className="mt-1.5 text-sm font-semibold leading-5 text-muted">
            {content.secondaryDescription}
          </p>
        ) : null}
        {step === 4 ? (
          <div className="mt-4 grid grid-cols-[.8fr_auto_.8fr_auto_1.35fr] items-center gap-1 rounded-control border border-border bg-surface-muted/45 px-2 py-3">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span className="grid size-8 place-items-center rounded-full bg-blue-soft/25 text-blue-strong">
                <Icon name="headphones" className="size-4" />
              </span>
              <span className="text-[10px] font-bold text-muted">Listen</span>
            </div>
            <Icon
              name="flow-arrow-right"
              className="size-4 shrink-0 text-muted/70"
            />
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span className="grid size-8 place-items-center rounded-full bg-coral/15 text-coral-strong">
                <Icon name="message" className="size-4" />
              </span>
              <span className="text-[10px] font-bold text-muted">
                Feedback
              </span>
            </div>
            <Icon
              name="flow-arrow-right"
              className="size-4 shrink-0 text-muted/70"
            />
            <div
              className="flex min-w-0 flex-col items-center gap-1.5"
              aria-label="+30 legit Spotify listens"
            >
              <span className="grid size-11 place-items-center rounded-full bg-lime text-sm font-black text-on-accent shadow-cta-glow-soft">
                +30
              </span>
              <span className="text-center text-[9px] font-black leading-3 text-lime-strong">
                legit Spotify listens
              </span>
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-md px-2 py-1.5 text-xs font-bold text-muted transition hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong"
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={handleAction}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-control border border-strong px-3.5 py-2 text-xs font-black text-on-accent transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background ${step === 4 ? "shadow-cta-glow-soft" : "shadow-raised"}`}
            style={{ backgroundColor: accent }}
          >
            {content.action}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
