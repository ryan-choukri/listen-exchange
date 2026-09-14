"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/Button";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ListenExchange
            </span>
          </h1>
          <p className="text-gray-400">Confirming your email</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400">Confirming your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="text-5xl">✅</div>
              <div>
                <p className="text-lg text-white mb-2">Email Confirmed!</p>
                <p className="text-gray-400">{message}</p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="text-5xl">⚠️</div>
              <div>
                <p className="text-lg text-white mb-2">Something went wrong</p>
                <p className="text-gray-400">{message}</p>
              </div>
              <Link href="/auth/signup">
                <Button className="w-full">Try Again</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
