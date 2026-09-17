"use server";

import { createClient } from "@/app/lib/supabase/server";
import {
  CONTACT_SUBJECTS,
  type ContactSubject,
} from "@/app/contact/contact-options";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_SUBJECT_SET = new Set<string>(CONTACT_SUBJECTS);

export interface ContactFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"email" | "subject" | "message", string>>;
}

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitContactMessage(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const email = readField(formData, "email").toLowerCase();
  const subject = readField(formData, "subject");
  const message = readField(formData, "message");
  const errors: NonNullable<ContactFormState["errors"]> = {};

  if (
    email.length < 5 ||
    email.length > 320 ||
    !EMAIL_PATTERN.test(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (!CONTACT_SUBJECT_SET.has(subject)) {
    errors.subject = "Choose a subject.";
  }

  if (message.length < 10) {
    errors.message = "Your message must be at least 10 characters.";
  } else if (message.length > 5000) {
    errors.message = "Your message must be 5,000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Please review the highlighted fields.",
      errors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    user_id: user?.id ?? null,
    email,
    subject: subject as ContactSubject,
    message,
  });

  if (error) {
    console.error("Contact message submission failed:", error);
    return {
      success: false,
      message: "We couldn’t send your message. Please try again shortly.",
    };
  }

  return {
    success: true,
    message: "Message sent!",
  };
}
