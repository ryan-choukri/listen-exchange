import "server-only";

import { createClient } from "@/app/lib/supabase/server";

export async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    return { supabase, identity: null } as const;
  }

  return {
    supabase,
    identity: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : "",
    },
  } as const;
}
