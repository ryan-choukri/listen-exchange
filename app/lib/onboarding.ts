export const ONBOARDING_VERSION = 1;
export const ONBOARDING_ELIGIBLE_AFTER = "2026-09-18T18:52:33.000Z";
export const ONBOARDING_STATE_CHANGED_EVENT =
  "listenexchange:onboarding-state-changed";
export const ONBOARDING_PREVIEW_READY_EVENT =
  "listenexchange:onboarding-preview-ready";

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface StoredOnboardingProgress {
  status: "active" | "skipped" | "completed";
  highestStep: OnboardingStep;
}

export function isOnboardingEligible(createdAt: string) {
  const createdAtTime = Date.parse(createdAt);
  const releaseTime = Date.parse(ONBOARDING_ELIGIBLE_AFTER);

  return Number.isFinite(createdAtTime) && createdAtTime >= releaseTime;
}

export function getOnboardingStorageKey(userId: string) {
  return `listenexchange:onboarding:v${ONBOARDING_VERSION}:${userId}`;
}

export function announceOnboardingStateChanged() {
  window.dispatchEvent(new Event(ONBOARDING_STATE_CHANGED_EVENT));
}

export function announceOnboardingPreviewReady() {
  window.dispatchEvent(new Event(ONBOARDING_PREVIEW_READY_EVENT));
}
