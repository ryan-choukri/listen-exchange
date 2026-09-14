"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ListenExchange
            </span>
          </h1>
          <p className="text-gray-400">Create your account</p>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Creating account..." : "Create Account"}
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
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
