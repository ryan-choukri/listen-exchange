"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/components/LogoutButton";
import { createClient } from "@/app/lib/supabase/client";
import { getUserProfile } from "@/app/actions/feedback";

interface User {
  id: string;
  email: string;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = await createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
          });

          // Fetch user profile for credits
          try {
            const profile = await getUserProfile();
            setCredits(profile?.credits ?? 0);
          } catch (err) {
            console.error("Error fetching profile:", err);
            setCredits(0);
          }
        } else {
          setUser(null);
          setCredits(0);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        setUser(null);
        setCredits(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isActive = (href: string) => pathname === href;

  const navLinks = [
    { href: "/discover", label: "Discover" },
    { href: "/submit", label: "Submit" },
  ];

  const authenticatedLinks = [
    ...navLinks,
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="border-b border-gray-700 sticky top-0 z-50 bg-gray-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold hover:text-green-400 transition-colors">
              ListenExchange
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-6">
            {(user ? authenticatedLinks : navLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive(link.href)
                    ? "text-green-400 font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section: Credits + Auth */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
            ) : user ? (
              <>
                {/* Credits Display */}
                <div className="hidden sm:flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
                  <span className="text-sm font-medium">🌟</span>
                  <span className="text-sm font-medium">{credits} credits</span>
                </div>

                {/* Logout Button */}
                <LogoutButton variant="secondary" size="sm" />
              </>
            ) : (
              <>
                {/* Login Button */}
                <Link href="/auth/login">
                  <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </button>
                </Link>

                {/* Sign Up Button */}
                <Link href="/auth/signup">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-400 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
