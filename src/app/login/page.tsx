"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import ScreenHeader from "@/components/ScreenHeader";
import { useAuth } from "@/components/AuthProvider";

function LoginContent() {
  const { signIn, status } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorMessage = await signIn(username, password);
    if (errorMessage) {
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }

    const nextPath = redirectedFrom && redirectedFrom.startsWith("/")
      ? redirectedFrom
      : "/";
    router.replace(nextPath);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Welcome Back"
        subtitle="Sign in to your private neon space."
      />

      <GlassCard>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">
              Username
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="sid or laxxu"
              autoComplete="username"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.3em] text-white/60">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your secure passcode"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || status === "loading"}
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Enter"}
          </button>
        </form>
      </GlassCard>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
        Access is limited to the two approved accounts.
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Welcome Back"
        subtitle="Sign in to your private neon space."
      />
      <GlassCard>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-11 w-full rounded-2xl bg-white/5" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-11 w-full rounded-2xl bg-white/5" />
          </div>
          <div className="h-11 w-full rounded-2xl border border-white/20 bg-white/10" />
        </div>
      </GlassCard>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
        Access is limited to the two approved accounts.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
