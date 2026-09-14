"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "./Button";

interface UserMenuProps {
  user: {
    email?: string;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex gap-3">
        <Link href="/auth/login">
          <Button variant="secondary" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-green-500 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
          {user.email?.[0].toUpperCase() || "U"}
        </div>
        <span className="text-sm text-gray-300 hidden sm:inline">
          {user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-lg z-50">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-t-lg"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-b-lg"
              onClick={() => setIsOpen(false)}
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
