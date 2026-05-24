"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { resolveEmail } from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  signIn: (username: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    void (async () => {
      try {
        console.info("[auth] initializing browser session");
        const supabase = getSupabaseBrowserClient();

        const sessionResult = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(sessionResult.data.session ?? null);
        setUser(sessionResult.data.session?.user ?? null);
        setStatus(sessionResult.data.session ? "authenticated" : "unauthenticated");

        const userResult = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(userResult.data.user ?? null);
        if (userResult.data.user) {
          setStatus("authenticated");
        }

        const { data } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, nextSession: Session | null) => {
            setSession(nextSession ?? null);
            void supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
              const { data } = result;
              if (!isMounted) return;
              setUser(data.user ?? nextSession?.user ?? null);
              setStatus(data.user || nextSession ? "authenticated" : "unauthenticated");
            });
          }
        );

        subscription = data.subscription;
      } catch (error) {
        console.error("[auth] browser session init failed", error);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const email = resolveEmail(username);
    if (!email) {
      return "This account is not allowed.";
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return error.message;
      }

      return null;
    } catch (error) {
      console.error("[auth] sign in failed", error);
      return "Sign in failed. Please try again.";
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[auth] sign out failed", error);
    }
  };

  const value = useMemo(
    () => ({
      status,
      session,
      user,
      signIn,
      signOut,
    }),
    [session, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
