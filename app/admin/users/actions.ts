"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/app/lib/auth/require-superadmin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CREDIT_ADJUSTMENT = 1_000_000;

export type AdminCreditOperation = "add" | "remove";

export interface AdminCreditMutationResult {
  success: boolean;
  message: string;
  credits?: number;
}

export async function modifyAdminUserCredits(
  userId: string,
  operation: AdminCreditOperation,
  amount: number,
): Promise<AdminCreditMutationResult> {
  if (!UUID_PATTERN.test(userId)) {
    return { success: false, message: "Invalid user." };
  }

  if (operation !== "add" && operation !== "remove") {
    return { success: false, message: "Invalid credit operation." };
  }

  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_CREDIT_ADJUSTMENT
  ) {
    return {
      success: false,
      message: `Amount must be between 1 and ${MAX_CREDIT_ADJUSTMENT.toLocaleString("en-US")}.`,
    };
  }

  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.rpc("adjust_admin_user_credits", {
    p_user_id: userId,
    p_operation: operation,
    p_amount: amount,
  });

  if (error || typeof data !== "number") {
    console.error("Admin user credit adjustment failed:", error);
    return {
      success: false,
      message:
        error?.code === "22003"
          ? "This removal would make the user's balance negative."
          : "Unable to update this user's credits.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/credits");

  return {
    success: true,
    message: "Credits updated.",
    credits: data,
  };
}
