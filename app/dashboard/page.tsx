"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import { LogoutButton } from "@/app/components/LogoutButton";
import { UserTracksStats } from "@/app/components/UserTracksStats";
import { UserSubmittedTracksList } from "@/app/components/UserSubmittedTracksList";
import { createClient } from "@/app/lib/supabase/client";

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
        } else {
          setUser({
            id: user.id,
            email: user.email || "",
            created_at: user.created_at || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleTrackDeleted = () => {
    // Increment refreshKey to reload both UserTracksStats and UserSubmittedTracksList
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">
            You need to be logged in to access this page.
          </p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold cursor-pointer hover:text-green-400 transition-colors">
              ListenExchange
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <Link
                href="/discover"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/submit"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Submit
              </Link>
            </nav>
            {/* Sign Out Button */}
            <LogoutButton size="sm" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-3xl font-bold mb-2">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {user.email}
              </span>
            </h2>
            <p className="text-gray-400">
              Your account is secure and ready to use.
            </p>
          </div>

          {/* User Submitted Tracks Stats */}
          {/* <UserTracksStats key={refreshKey} /> */}

          {/* User Submitted Tracks List */}
          <UserSubmittedTracksList
            key={refreshKey}
            refreshKey={refreshKey}
            onTrackDeleted={handleTrackDeleted}
          />

          {/* Account Info */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Account Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">User ID</p>
                <p className="text-gray-300 font-mono text-sm break-all">
                  {user.id}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Account Created</p>
                <p className="text-white font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/discover" className="flex-1">
                <Button className="w-full">Start Listening</Button>
              </Link>
              <Link href="/submit" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Submit a Track
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
