"use client";

import GlassCard from "@/components/GlassCard";
import ScreenHeader from "@/components/ScreenHeader";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { signOut } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Profile"
        subtitle="Personalize your shared atmosphere."
        right={
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            Logout
          </button>
        }
      />

      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-base font-semibold text-white shadow-[0_0_22px_rgba(255,255,255,0.12)]">
            LD
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] text-white/80">
              LV
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-white">Luna + Kai</p>
            <p className="text-xs text-white/60">Private space • Phase 1</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                "Together 2y",
                "Night Mode",
                "Offline Ready",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/65"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Moments", value: "48" },
          { label: "Albums", value: "6" },
          { label: "Notes", value: "14" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center"
          >
            <p className="text-lg font-semibold text-white">{item.value}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Theme preferences are saved locally and sync later.
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Offline mode is active for base assets.
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Private sharing spaces unlock after secure onboarding.
        </div>
      </div>
    </div>
  );
}
