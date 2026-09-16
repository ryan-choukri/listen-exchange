"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { AuthShell } from "@/app/components/AuthShell";
import { Notice } from "@/app/components/ui/design-system";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message || "Password reset email sent!");
        setEmail("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email address and we’ll send you a link to choose a new password."
    >
      {error && (
        <div className="mb-5">
          <Notice tone="danger" title="Reset link could not be sent">{error}</Notice>
        </div>
      )}

      {success && (
        <div className="mb-5">
          <Notice tone="success" title="Check your inbox">{success}</Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>

      <div className="mt-7 text-center">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-sm text-muted">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-bold text-coral-strong hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
