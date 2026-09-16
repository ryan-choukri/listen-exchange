"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { AuthShell } from "@/app/components/AuthShell";
import { Notice } from "@/app/components/ui/design-system";

export default function ResetPasswordPage() {
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
      const result = await updatePassword(password, confirmPassword);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message || "Password updated successfully!");
        setPassword("");
        setConfirmPassword("");
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
      title="Set a new password"
      description="Choose a secure password to get back to the music."
    >
      {error && (
        <div className="mb-5">
          <Notice tone="danger" title="Password could not be updated">{error}</Notice>
        </div>
      )}

      {success && (
        <div className="mb-5">
          <Notice tone="success" title="Password updated">
            {success}{" "}
            <Link href="/auth/login" className="font-bold underline">
              Back to login
            </Link>
          </Notice>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="New Password"
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
          Update Password
        </Button>
      </form>
    </AuthShell>
  );
}
