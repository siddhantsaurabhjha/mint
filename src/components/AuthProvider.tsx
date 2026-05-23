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
    const supabase = getSupabaseBrowserClient();

    let isMounted = true;
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      const { data } = result;
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      const { data } = result;
      if (!isMounted) return;
      setUser(data.user ?? null);
      if (data.user) {
        setStatus("authenticated");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const email = resolveEmail(username);
    if (!email) {
      return "This account is not allowed.";
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return error.message;
    }

    return null;
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
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
