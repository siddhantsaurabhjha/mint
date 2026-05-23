"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { deleteCloudinaryAsset } from "@/lib/media/upload";
import { extractCloudinaryPublicId } from "@/lib/media/cloudinary";
import { sendPushNotification } from "@/lib/pwa/push";

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

export type StoryComment = {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type StoryView = {
  id: string;
  story_id: string;
  user_id: string;
  created_at: string;
};

export function useStories({
  userId,
  username,
}: {
  userId: string | null;
  username: string | null;
}) {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [reactions, setReactions] = useState<StoryReaction[]>([]);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [views, setViews] = useState<StoryView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const fetchStories = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false });

    if (data) {
      setStories(data as StoryItem[]);
    }
    setIsLoading(false);
  }, [nowIso]);

  const loadReactions = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("story_reactions")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) {
      setReactions(data as StoryReaction[]);
    }
  }, []);

  const loadComments = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("story_replies")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data as StoryComment[]);
    }
  }, []);

  const loadViews = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("story_views")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setViews(data as StoryView[]);
    }
  }, []);

  const cleanupExpiredStories = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("stories")
      .select("id, media_url, type")
      .lt("expires_at", new Date().toISOString());

    if (!data || data.length === 0) return;

    await Promise.all(
      data.map(async (item) => {
        if (!item.media_url) return;
        const publicId = extractCloudinaryPublicId(item.media_url);
        if (!publicId) return;
        const resourceType = item.type === "video" ? "video" : "image";
        await deleteCloudinaryAsset(publicId, resourceType);
      })
    );

    await supabase
      .from("stories")
      .delete()
      .lt("expires_at", new Date().toISOString());
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void (async () => {
      await fetchStories();
      await loadReactions();
      await loadComments();
      await loadViews();
      await cleanupExpiredStories();
    })();

    const channel = supabase
      .channel("stories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    loadReactions,
    loadComments,
    loadViews,
    cleanupExpiredStories,
    fetchStories,
  ]);

  const createStory = useCallback(
    async ({
      type,
      mediaUrl,
      caption,
    }: {
      type: "image" | "video";
      mediaUrl: string;
      caption?: string | null;
    }) => {
      if (!userId || !username) return { data: null, error: null };
      const supabase = getSupabaseBrowserClient();
      const payload = {
        user_id: userId,
        username,
        type,
        media_url: mediaUrl,
        caption: caption ?? null,
      };
      const result = await supabase
        .from("stories")
        .insert(payload)
        .select("*")
        .single();

      if (!result.error && result.data) {
        setStories((prev) => [result.data as StoryItem, ...prev]);
        await sendPushNotification({
          title: "New story",
          body: `${username ?? "Someone"} shared a story`,
          url: "/stories",
          tag: "story",
          senderId: userId,
          badge: 1,
        });
      }

      return result;
    },
    [userId, username]
  );

  const deleteStory = useCallback(async (story: StoryItem) => {
    const supabase = getSupabaseBrowserClient();
    if (story.media_url) {
      const publicId = extractCloudinaryPublicId(story.media_url);
      if (publicId) {
        const resourceType = story.type === "video" ? "video" : "image";
        await deleteCloudinaryAsset(publicId, resourceType);
      }
    }
    const { error } = await supabase.from("stories").delete().eq("id", story.id);
    if (!error) {
      setStories((prev) => prev.filter((item) => item.id !== story.id));
      setReactions((prev) => prev.filter((item) => item.story_id !== story.id));
      setComments((prev) => prev.filter((item) => item.story_id !== story.id));
      setViews((prev) => prev.filter((item) => item.story_id !== story.id));
    }
  }, []);

  const addReaction = useCallback(
    async (storyId: string, reaction: string) => {
      if (!userId) return;
      const supabase = getSupabaseBrowserClient();
      const result = await supabase
        .from("story_reactions")
        .insert({ story_id: storyId, user_id: userId, reaction })
        .select("*")
        .single();
      if (!result.error && result.data) {
        setReactions((prev) => {
          if (prev.some((item) => item.id === result.data.id)) return prev;
          return [...prev, result.data as StoryReaction];
        });
      }
    },
    [userId]
  );

  const addComment = useCallback(
    async (storyId: string, body: string) => {
      if (!userId) return;
      const supabase = getSupabaseBrowserClient();
      const result = await supabase
        .from("story_replies")
        .insert({ story_id: storyId, user_id: userId, body })
        .select("*")
        .single();
      if (!result.error && result.data) {
        setComments((prev) => {
          if (prev.some((item) => item.id === result.data.id)) return prev;
          return [...prev, result.data as StoryComment];
        });
      }
    },
    [userId]
  );

  const markSeen = useCallback(
    async (storyId: string) => {
      if (!userId) return;
      if (views.some((view) => view.story_id === storyId && view.user_id === userId)) {
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("story_views")
        .insert({ story_id: storyId, user_id: userId })
        .select("*")
        .single();
      if (!error && data) {
        setViews((prev) => {
          if (prev.some((item) => item.id === data.id)) return prev;
          return [...prev, data as StoryView];
        });
      }
    },
    [userId, views]
  );

  return {
    stories,
    reactions,
    comments,
    views,
    isLoading,
    createStory,
    deleteStory,
    addReaction,
    addComment,
    markSeen,
  };
}
