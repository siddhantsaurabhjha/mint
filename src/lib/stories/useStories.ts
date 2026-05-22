"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type StoryItem = {
  id: string;
  user_id: string;
  username: string;
  type: "image" | "video" | "text";
  media_url: string | null;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export type StoryReaction = {
  id: string;
  story_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
};

export function useStories() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStories = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setStories(data as StoryItem[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStories();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("stories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stories" },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [loadStories]);

  return { stories, isLoading };
}
