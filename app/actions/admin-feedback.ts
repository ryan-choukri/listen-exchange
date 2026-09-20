"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminFeedbackMutationResult {
  success: boolean;
  message: string;
  feedback?: string;
}

function revalidateFeedbackViews() {
  revalidatePath("/admin", "layout");
  revalidatePath("/discover");
  revalidatePath("/submit");
}

export async function updateAdminFeedback(
  feedbackId: string,
  feedback: string,
): Promise<AdminFeedbackMutationResult> {
  if (!UUID_PATTERN.test(feedbackId)) {
    return { success: false, message: "Invalid feedback." };
  }

  const trimmedFeedback = feedback.trim();
  if (trimmedFeedback.length < 10 || trimmedFeedback.length > 500) {
    return {
      success: false,
      message: "Feedback must contain between 10 and 500 characters.",
    };
  }

  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.rpc("update_admin_feedback", {
    p_feedback_id: feedbackId,
    p_feedback: trimmedFeedback,
  });

  if (error || typeof data !== "string") {
    console.error("Admin feedback update failed:", error);
    return { success: false, message: "Unable to update this feedback." };
  }

  revalidateFeedbackViews();
  return {
    success: true,
    message: "Feedback updated.",
    feedback: data,
  };
}

export async function deleteAdminFeedback(
  feedbackId: string,
): Promise<AdminFeedbackMutationResult> {
  if (!UUID_PATTERN.test(feedbackId)) {
    return { success: false, message: "Invalid feedback." };
  }

  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.rpc("delete_admin_feedback", {
    p_feedback_id: feedbackId,
  });

  if (error) {
    console.error("Admin feedback deletion failed:", error);
    return {
      success: false,
      message: "Unable to delete this feedback and reverse its credits.",
    };
  }

  const result = data as
    | { success?: boolean; message?: string; already_deleted?: boolean }
    | null;

  if (result?.success !== true) {
    return {
      success: false,
      message: result?.message || "Unable to delete this feedback.",
    };
  }

  revalidateFeedbackViews();
  return {
    success: true,
    message: result.message || "Feedback deleted.",
  };
}
