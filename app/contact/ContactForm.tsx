"use client";

import { useActionState, useState } from "react";
import {
  submitContactMessage,
  type ContactFormState,
} from "@/app/actions/contact";
import { Button } from "@/app/components/Button";
import {
  Notice,
  SelectField,
  TextareaField,
  TextField,
} from "@/app/components/ui/design-system";
import { CONTACT_SUBJECTS } from "@/app/contact/contact-options";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";

const INITIAL_STATE: ContactFormState = {
  success: false,
  message: "",
};

export function ContactForm() {
  const { user } = useCurrentUser();
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    INITIAL_STATE,
  );
  const [message, setMessage] = useState("");

  if (state.success) {
    return (
      <div
        className="grid min-h-80 place-items-center px-5 py-12 text-center sm:px-8"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-md">
          <span className="mx-auto grid size-16 place-items-center rounded-full border border-lime-strong bg-lime text-on-accent shadow-highlight">
            <span className="text-3xl" aria-hidden="true">
              ✓
            </span>
          </span>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-ink">
            Message sent!
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Thanks for reaching out. We&apos;ll get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 p-5 sm:p-7">
      <TextField
        key={user?.email ?? "anonymous"}
        id="contact-email"
        name="email"
        type="email"
        label="Email"
        defaultValue={user?.email ?? ""}
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={320}
        required
        disabled={pending}
        error={state.errors?.email}
      />

      <SelectField
        id="contact-subject"
        name="subject"
        label="Subject"
        defaultValue=""
        required
        disabled={pending}
        error={state.errors?.subject}
      >
        <option value="" disabled>
          Choose a subject
        </option>
        {CONTACT_SUBJECTS.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </SelectField>

      <TextareaField
        id="contact-message"
        name="message"
        label="Message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell us what’s on your mind…"
        minLength={10}
        maxLength={5000}
        count={message.length}
        rows={7}
        required
        disabled={pending}
        error={state.errors?.message}
        helper="Give us enough detail to understand how we can help."
      />

      {state.message && (
        <div aria-live="polite">
          <Notice tone="danger" title="Message not sent">
            {state.message}
          </Notice>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          size="lg"
          icon="message"
          loading={pending}
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
