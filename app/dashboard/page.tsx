"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/app/components/Button";
import { AppShell } from "@/app/components/AppShell";
import { AuthShell } from "@/app/components/AuthShell";
import { PageHeader } from "@/app/components/PageHeader";
import { UserSubmittedTracksList } from "@/app/components/UserSubmittedTracksList";
import { createClient } from "@/app/lib/supabase/client";
import { Icon, Surface } from "@/app/components/ui/design-system";

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
      <div className="paper-canvas grid min-h-screen place-items-center bg-background text-muted">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-border border-r-coral" />
          <p className="text-sm font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthShell
        eyebrow="Members only"
        title="Sign in required"
        description="You need to be logged in to access your dashboard."
      >
        <LinkButton href="/auth/login" className="w-full" icon="user">
          Go to Login
        </LinkButton>
      </AuthShell>
    );
  }

  return (
    <AppShell width="medium">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Your space"
          title={`Welcome, ${user.email.split("@")[0]}`}
          description="Manage your tracks, review their listen allocation, and keep the community exchange moving."
        />

        <UserSubmittedTracksList
          key={refreshKey}
          refreshKey={refreshKey}
          onTrackDeleted={handleTrackDeleted}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Surface className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-blue-soft/40 text-blue-strong">
                <Icon name="user" />
              </span>
              <h2 className="text-lg font-black text-ink">
                Account Information
              </h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Email
                </dt>
                <dd className="mt-1 font-semibold text-ink">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  User ID
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-muted">
                  {user.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Account Created
                </dt>
                <dd className="mt-1 font-semibold text-ink">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className="flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-lime/45 text-ink">
                <Icon name="sparkle" />
              </span>
              <h2 className="text-lg font-black text-ink">Quick Links</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Listen to a new release or add a track for the community to
              review.
            </p>
            <div className="mt-auto grid gap-3 pt-6">
              <LinkButton href="/discover" icon="headphones" className="w-full">
                Start Listening
              </LinkButton>
              <LinkButton
                href="/submit"
                variant="secondary"
                icon="upload"
                className="w-full"
              >
                Submit a Track
              </LinkButton>
            </div>
          </Surface>
        </div>
      </div>
    </AppShell>
  );
}
