import "server-only";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: isSuperadmin, error: roleError } = await supabase.rpc(
    "has_role",
    { requested_role: "superadmin" },
  );

  if (roleError) {
    console.error("Superadmin authorization check failed:", roleError.message);
    notFound();
  }

  if (isSuperadmin !== true) {
    notFound();
  }

  return { userId: user.id } as const;
}
