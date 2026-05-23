"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SharedNote = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const ROOM_ID = "lumen-duo";

const normalizeNote = (note: Record<string, unknown>): SharedNote => ({
  id: String(note.id ?? ""),
  room_id: String(note.room_id ?? ROOM_ID),
  user_id: String(note.user_id ?? ""),
  username: String(note.username ?? "Partner"),
  content: String(note.content ?? ""),
  created_at: String(note.created_at ?? new Date().toISOString()),
  updated_at: String(note.updated_at ?? note.created_at ?? new Date().toISOString()),
});

export function useSharedNotes(userId: string | null, username: string | null) {
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("shared_notes")
      .select("*")
      .eq("room_id", ROOM_ID)
      .order("created_at", { ascending: false });

    if (data) {
      setNotes(data.map((item) => normalizeNote(item as Record<string, unknown>)));
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    let channel: RealtimeChannel | null = null;

    void (async () => {
      await fetchNotes();

      if (!isMounted) return;

      channel = supabase
        .channel(`shared-notes:${ROOM_ID}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shared_notes",
            filter: `room_id=eq.${ROOM_ID}`,
          },
          (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
            if (!isMounted) return;

            if (payload.eventType === "DELETE") {
              const removedId = String(payload.old?.id ?? "");
              if (!removedId) return;
              setNotes((prev) => prev.filter((item) => item.id !== removedId));
              return;
            }

            if (!payload.new) return;
            const next = normalizeNote(payload.new);
            setNotes((prev) => {
              const index = prev.findIndex((item) => item.id === next.id);
              if (index === -1) return [next, ...prev];
              const copy = [...prev];
              copy[index] = next;
              return copy;
            });
          }
        )
        .subscribe();
    })();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [fetchNotes, supabase]);

  const createNote = useCallback(
    async (content: string) => {
      if (!userId || !username || !content.trim()) return false;
      setIsSaving(true);
      try {
        const { error } = await supabase.from("shared_notes").insert({
          room_id: ROOM_ID,
          user_id: userId,
          username,
          content,
        });
        return !error;
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, username]
  );

  const updateNote = useCallback(
    async (noteId: string, content: string) => {
      if (!userId || !content.trim()) return false;
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("shared_notes")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", noteId)
          .eq("user_id", userId);
        return !error;
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!userId) return false;
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("shared_notes")
          .delete()
          .eq("id", noteId)
          .eq("user_id", userId);
        return !error;
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId]
  );

  return {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    deleteNote,
  };
}