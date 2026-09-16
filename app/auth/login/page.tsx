"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { AuthShell } from "@/app/components/AuthShell";
import { Notice } from "@/app/components/ui/design-system";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Pick up where you left off and keep the exchange moving."
      footer={
        <p className="text-xs text-muted">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      }
    >
      {error && (
        <div className="mb-5">
          <Notice tone="danger" title="Sign in failed">{error}</Notice>
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
          disabled={loading}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      <div className="mt-7 space-y-4 text-center">
        <Link
          href="/auth/forgot-password"
          className="block text-sm font-semibold text-muted transition-colors hover:text-coral-strong"
        >
          Forgot your password?
        </Link>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-bold text-coral-strong hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
