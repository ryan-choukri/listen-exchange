"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/app/components/Button";
import { AuthShell } from "@/app/components/AuthShell";
import { Icon, Notice } from "@/app/components/ui/design-system";

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if we have the session from Supabase redirect
    const timeout = setTimeout(() => {
      setStatus("success");
      setMessage("Email confirmed! You can now sign in with your account.");
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AuthShell
      eyebrow="One last step"
      title="Confirming your email"
      description="We’re verifying your account so you can join the exchange."
    >
      {status === "loading" && (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto size-11 animate-spin rounded-full border-4 border-border border-t-coral" />
          <p className="text-sm font-semibold text-muted">Confirming your email...</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-5">
          <Notice tone="success" title="Email Confirmed!">{message}</Notice>
          <LinkButton href="/auth/login" icon="user" className="w-full">
            Go to Sign In
          </LinkButton>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-5">
          <Notice tone="danger" title="Something went wrong">{message}</Notice>
          <LinkButton href="/auth/signup" icon="arrow-left" className="w-full">
            Try Again
          </LinkButton>
        </div>
      )}

      <div className="mt-6 flex justify-center text-muted">
        <Icon name="heart" className="size-5" />
      </div>
    </AuthShell>
  );
}
