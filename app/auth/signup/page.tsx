"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { AuthShell } from "@/app/components/AuthShell";
import { Notice } from "@/app/components/ui/design-system";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await signUp(email, password, confirmPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message || "Account created successfully!");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred during signup",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the community"
      title="Create your account"
      description="Listen with care, support artists, and earn listens for your own tracks."
      footer={
        <p className="text-xs text-muted">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      }
    >
      {error && (
        <div className="mb-5">
          <Notice tone="danger" title="Account could not be created">{error}</Notice>
        </div>
      )}

      {success && (
        <div className="mb-5">
          <Notice tone="success" title="Account created">{success}</Notice>
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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="At least 6 characters"
          disabled={loading}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <div className="mt-7 space-y-4 text-center">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-coral-strong hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
