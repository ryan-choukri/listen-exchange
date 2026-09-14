"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ListenExchange
            </span>
          </h1>
          <p className="text-gray-400">Reset your password</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <p className="text-gray-300 text-sm mb-6">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
              <p className="text-green-200 text-sm">{success}</p>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4 text-center">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <p className="text-gray-400">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
