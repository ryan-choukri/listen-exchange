import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedClient } from "@/app/lib/auth/get-authenticated-client";

export const requireSuperadmin = cache(async () => {
  const { supabase, identity } = await getAuthenticatedClient();

  if (!identity) {
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

  return {
    userId: identity.id,
    email: identity.email || "Admin",
    supabase,
  } as const;
});
