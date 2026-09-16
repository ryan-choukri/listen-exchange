export const CREDITS_UPDATED_EVENT = "listenexchange:credits-updated";

export interface CreditsUpdatedDetail {
  balance?: number;
}

export function announceCreditsUpdated(balance?: number) {
  window.dispatchEvent(
    new CustomEvent<CreditsUpdatedDetail>(CREDITS_UPDATED_EVENT, {
      detail: { balance },
    }),
  );
}
