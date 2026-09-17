export const CONTACT_SUBJECTS = [
  "Bug",
  "Question",
  "Suggestion",
  "Partnership",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];
