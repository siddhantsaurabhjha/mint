"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ProfilePresencePatch = {
  avatarUrl?: string | null;
  bio?: string | null;
  mood?: string | null;
};

export async function syncProfilePresence({
  userId,
  username,
  isOnline,
  profile,
}: {
  userId: string;
  username: string;
  isOnline: boolean;
  profile?: ProfilePresencePatch;
}) {
  const supabase = getSupabaseBrowserClient();
  const timestamp = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: userId,
    username,
    is_online: isOnline,
    last_seen: timestamp,
    updated_at: timestamp,
  };

  if (profile?.avatarUrl !== undefined) {
    payload.avatar_url = profile.avatarUrl;
  }
  if (profile?.bio !== undefined) {
    payload.bio = profile.bio;
  }
  if (profile?.mood !== undefined) {
    payload.mood = profile.mood;
  }

  const { data } = await supabase
    .from("user_presence")
    .update(payload)
    .eq("user_id", userId)
    .select("id");

  if (!data || data.length === 0) {
    await supabase.from("user_presence").insert(payload);
  }
}