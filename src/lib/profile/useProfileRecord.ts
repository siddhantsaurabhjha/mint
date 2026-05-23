"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ProfileRecord = {
  user_id: string;
  name: string | null;
  bio: string | null;
  mood: string | null;
  avatar_url: string | null;
};

type ProfileSeed = {
  name?: string | null;
  bio?: string | null;
  mood?: string | null;
  avatar_url?: string | null;
};

const cleanText = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeProfileRecord = (row: Record<string, unknown>): ProfileRecord => ({
  user_id: cleanText(row.user_id) ?? "",
  name: cleanText(row.name),
  bio: cleanText(row.bio),
  mood: cleanText(row.mood),
  avatar_url: cleanText(row.avatar_url),
});

const hasSeedValue = (seed: ProfileSeed) =>
  Boolean(seed.name || seed.bio || seed.mood || seed.avatar_url);

const resolvePatchValue = (
  value: string | null | undefined,
  fallback: string | null
) => (value === undefined ? fallback : cleanText(value));

export function useProfileRecord(userId: string | null, seedProfile?: ProfileSeed | null) {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      seededRef.current = false;
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    setIsLoading(true);
    seededRef.current = false;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, bio, mood, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) return;

      if (!error && data) {
        setProfile(normalizeProfileRecord(data as Record<string, unknown>));
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    };

    void loadProfile();

    const channel = supabase
      .channel(`profiles:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> | null }) => {
          if (!isMounted) return;
          if (!payload.new) {
            setProfile(null);
            return;
          }
          setProfile(normalizeProfileRecord(payload.new));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || isLoading || profile || seededRef.current) return;
    if (!seedProfile || !hasSeedValue(seedProfile)) return;

    seededRef.current = true;
    const supabase = getSupabaseBrowserClient();

    void supabase.from("profiles").upsert(
      {
        user_id: userId,
        name: cleanText(seedProfile.name),
        bio: cleanText(seedProfile.bio),
        mood: cleanText(seedProfile.mood),
        avatar_url: cleanText(seedProfile.avatar_url),
      },
      { onConflict: "user_id" }
    );
  }, [isLoading, profile, seedProfile, userId]);

  useEffect(() => {
    if (!userId || isLoading || !profile || !seedProfile?.name) return;
    if (profile.name === seedProfile.name) return;

    const supabase = getSupabaseBrowserClient();
    void supabase.from("profiles").upsert(
      {
        user_id: userId,
        name: cleanText(seedProfile.name),
        bio: profile.bio,
        mood: profile.mood,
        avatar_url: profile.avatar_url,
      },
      { onConflict: "user_id" }
    );
  }, [isLoading, profile, seedProfile?.name, userId]);

  const upsertProfile = useCallback(
    async (patch: Partial<Omit<ProfileRecord, "user_id">>) => {
      if (!userId) return false;

      const supabase = getSupabaseBrowserClient();
      const payload = {
        user_id: userId,
        name: resolvePatchValue(patch.name, profile?.name ?? null),
        bio: resolvePatchValue(patch.bio, profile?.bio ?? null),
        mood: resolvePatchValue(patch.mood, profile?.mood ?? null),
        avatar_url: resolvePatchValue(patch.avatar_url, profile?.avatar_url ?? null),
      };

      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "user_id",
      });

      return !error;
    },
    [profile, userId]
  );

  return {
    profile,
    isLoading,
    upsertProfile,
  };
}