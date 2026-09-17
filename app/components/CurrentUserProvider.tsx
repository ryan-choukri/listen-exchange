"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/app/lib/supabase/client";
import {
  CREDITS_UPDATED_EVENT,
  type CreditsUpdatedDetail,
} from "@/app/lib/credits-events";

export interface CurrentUserUI {
  id: string;
  email: string;
  credits: number;
  createdAt: string;
}

interface CurrentUserContextValue {
  user: CurrentUserUI | null;
  isLoading: boolean;
  ensureUser: () => Promise<CurrentUserUI | null>;
  refreshUser: () => Promise<CurrentUserUI | null>;
  setCredits: (credits: number) => void;
  clearUser: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

async function fetchCurrentUser(): Promise<CurrentUserUI | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, created_at")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching current user profile:", profileError);
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    credits: Number(profile?.credits ?? 0),
    createdAt:
      profile?.created_at ??
      new Date(Number(claims.iat ?? 0) * 1_000).toISOString(),
  };
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedUserRef = useRef<CurrentUserUI | null>(null);
  const hasLoadedRef = useRef(false);
  const pendingLoadRef = useRef<Promise<CurrentUserUI | null> | null>(null);

  const loadUser = useCallback(async (force: boolean) => {
    if (!force && hasLoadedRef.current && loadedUserRef.current) {
      return loadedUserRef.current;
    }

    if (pendingLoadRef.current) {
      return pendingLoadRef.current;
    }

    setIsLoading(true);
    const pendingLoad = fetchCurrentUser()
      .then((nextUser) => {
        loadedUserRef.current = nextUser;
        hasLoadedRef.current = true;
        setUser(nextUser);
        return nextUser;
      })
      .catch((error) => {
        console.error("Error loading current user:", error);
        loadedUserRef.current = null;
        hasLoadedRef.current = true;
        setUser(null);
        return null;
      })
      .finally(() => {
        pendingLoadRef.current = null;
        setIsLoading(false);
      });

    pendingLoadRef.current = pendingLoad;
    return pendingLoad;
  }, []);

  const ensureUser = useCallback(() => loadUser(false), [loadUser]);
  const refreshUser = useCallback(() => loadUser(true), [loadUser]);

  const setCredits = useCallback((credits: number) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, credits };
      loadedUserRef.current = nextUser;
      return nextUser;
    });
  }, []);

  const clearUser = useCallback(() => {
    loadedUserRef.current = null;
    hasLoadedRef.current = true;
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearUser();
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        window.setTimeout(() => void refreshUser(), 0);
      }
    });

    const handleCreditsUpdated = (event: Event) => {
      const { balance } =
        (event as CustomEvent<CreditsUpdatedDetail>).detail ?? {};

      if (typeof balance === "number") {
        setCredits(balance);
      } else {
        void refreshUser();
      }
    };

    window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated);
    };
  }, [clearUser, refreshUser, setCredits]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      ensureUser,
      refreshUser,
      setCredits,
      clearUser,
    }),
    [clearUser, ensureUser, isLoading, refreshUser, setCredits, user],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  const ensureUser = context?.ensureUser;

  useEffect(() => {
    if (ensureUser) {
      void ensureUser();
    }
  }, [ensureUser]);

  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }

  return context;
}
