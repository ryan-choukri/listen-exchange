"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminMessageMutationResult {
  success: boolean;
  message: string;
}

export async function removeAdminMessage(
  messageId: string,
): Promise<AdminMessageMutationResult> {
  if (!UUID_PATTERN.test(messageId)) {
    return { success: false, message: "Invalid message." };
  }

  const { supabase } = await requireSuperadmin();
  const { data: removed, error } = await supabase.rpc(
    "remove_admin_message",
    { p_message_id: messageId },
  );

  if (error) {
    console.error("Admin message soft delete failed:", error);
    return { success: false, message: "Unable to remove this message." };
  }

  if (removed !== true) {
    return { success: false, message: "Message not found." };
  }

  revalidatePath("/admin/messages");
  return { success: true, message: "Message removed." };
}
