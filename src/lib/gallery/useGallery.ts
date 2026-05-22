"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type GalleryItem = {
  id: string;
  room_id: string;
  owner_id: string;
  type: "image" | "video" | "audio" | "note";
  title: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function useGallery(roomId: string) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (data) {
      setItems(data as GalleryItem[]);
    }
    setIsLoading(false);
  }, [roomId]);

  useEffect(() => {
    loadItems();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`gallery:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_items" },
        () => {
          loadItems();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [loadItems, roomId]);

  const addItem = useCallback(
    async ({
      ownerId,
      type,
      title,
      mediaUrl,
      thumbnailUrl,
      metadata,
    }: {
      ownerId: string;
      type: "image" | "video";
      title?: string | null;
      mediaUrl: string;
      thumbnailUrl?: string | null;
      metadata?: Record<string, unknown> | null;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const payload: Record<string, unknown> = {
        room_id: roomId,
        owner_id: ownerId,
        type,
        title: title ?? null,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl ?? null,
        metadata: metadata ?? null,
      };

      return supabase.from("gallery_items").insert(payload).select("*").single();
    },
    [roomId]
  );

  const deleteItem = useCallback(async (itemId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("gallery_items").delete().eq("id", itemId);
  }, []);

  return { items, isLoading, addItem, deleteItem };
}
