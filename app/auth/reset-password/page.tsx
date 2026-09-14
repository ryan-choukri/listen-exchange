"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ListenExchange
            </span>
          </h1>
          <p className="text-gray-400">Set a new password</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
              <p className="text-green-200 text-sm">{success}</p>
              <Link
                href="/auth/login"
                className="text-green-300 hover:text-green-200 text-sm mt-3 block underline"
              >
                Back to login
              </Link>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
