"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type CountdownEvent = {
  id: string;
  title: string;
  target_date: string;
  created_by?: string | null;
  created_at?: string | null;
};

const orderByTargetDate = (items: CountdownEvent[]) =>
  [...items].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

export function useCountdowns({ userId }: { userId?: string | null }) {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const deletingRef = useRef<Set<string>>(new Set());

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const normalizeTargetDate = useCallback((value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid target_date value.");
    }
    return parsed.toISOString();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.info("[countdowns] fetching events");

      const { data, error: fetchError } = await supabase
        .from("countdown_events")
        .select("id, title, target_date, created_by, created_at")
        .order("target_date", { ascending: true });

      console.info("[countdowns] fetch response", { data, error: fetchError });

      if (fetchError) {
        setError(fetchError.message);
        console.error("[countdowns] fetch failed", fetchError);
        return;
      }

      setEvents(orderByTargetDate((data ?? []) as CountdownEvent[]));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchEvents();

    const channel = supabase.channel("public:countdown_events");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "countdown_events" },
      (payload: any) => {
        console.info("[countdowns] realtime event", payload.eventType, payload);

        const next = payload.new as CountdownEvent | null;
        const previous = payload.old as CountdownEvent | null;

        if (payload.eventType === "INSERT" && next) {
          setEvents((current) => {
            const merged = current.some((item) => item.id === next.id)
              ? current.map((item) => (item.id === next.id ? next : item))
              : [...current, next];
            return orderByTargetDate(merged);
          });
        }

        if (payload.eventType === "UPDATE" && next) {
          setEvents((current) => orderByTargetDate(current.map((item) => (item.id === next.id ? next : item))));
        }

        if (payload.eventType === "DELETE" && previous) {
          setEvents((current) => current.filter((item) => item.id !== previous.id));
        }
      }
    );

    void channel.subscribe((status: string) => {
      console.info("[countdowns] realtime status", status);
    });

    channelRef.current = channel;

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [fetchEvents, supabase]);

  const createEvent = useCallback(
    async ({ title, target_date }: { title: string; target_date: string }) => {
      if (!userId) {
        const authError = new Error("Missing user session for countdown insert.");
        setError(authError.message);
        console.error("[countdowns] insert failed", authError);
        return { data: null, error: authError };
      }

      let normalizedTargetDate: string;
      try {
        normalizedTargetDate = normalizeTargetDate(target_date);
      } catch (conversionError) {
        setError(conversionError instanceof Error ? conversionError.message : "Invalid date.");
        console.error("[countdowns] invalid target_date", conversionError);
        return { data: null, error: conversionError instanceof Error ? conversionError : new Error("Invalid date.") };
      }

      const payload = {
        title: title.trim(),
        target_date: normalizedTargetDate,
        created_by: userId ?? null,
      };

      console.info("[countdowns] insert payload", payload);

      const { data, error: insertError } = await supabase
        .from("countdown_events")
        .insert(payload, { returning: "minimal" });

      console.info("[countdowns] insert response", { data, error: insertError });
      console.log(insertError);

      if (insertError) {
        setError(insertError.message);
        console.error("[countdowns] insert failed", insertError);
        return { data: null, error: insertError };
      }

      await fetchEvents();
      return { data: null, error: null };
    },
    [fetchEvents, normalizeTargetDate, supabase, userId]
  );

  const updateEvent = useCallback(
    async ({ id, title, target_date }: { id: string; title: string; target_date: string }) => {
      const payload = { title: title.trim(), target_date };
      console.info("[countdowns] update payload", { id, ...payload });

      const { data, error: updateError } = await supabase
        .from("countdown_events")
        .update(payload)
        .eq("id", id)
        .select("id, title, target_date, created_by, created_at")
        .single();

      console.info("[countdowns] update response", { data, error: updateError });

      if (updateError) {
        setError(updateError.message);
        console.error("[countdowns] update failed", updateError);
      }

      if (data) {
        setEvents((current) => orderByTargetDate(current.map((item) => (item.id === id ? (data as CountdownEvent) : item))));
      }

      await fetchEvents();
      return { data: data as CountdownEvent | null, error: updateError };
    },
    [fetchEvents, supabase]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (deletingRef.current.has(id)) return;
      deletingRef.current.add(id);

      try {
        console.info("[countdowns] delete payload", { id });
        const { error: deleteError } = await supabase.from("countdown_events").delete().eq("id", id);
        console.info("[countdowns] delete response", { error: deleteError });

        if (deleteError) {
          setError(deleteError.message);
          console.error("[countdowns] delete failed", deleteError);
          return;
        }

        setEvents((current) => current.filter((item) => item.id !== id));
        await fetchEvents();
      } finally {
        deletingRef.current.delete(id);
      }
    },
    [fetchEvents, supabase]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const interval = window.setInterval(() => {
      const now = Date.now();
      events.forEach((event) => {
        const targetTime = new Date(event.target_date).getTime();
        if (Number.isFinite(targetTime) && targetTime <= now) {
          void deleteEvent(event.id);
        }
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deleteEvent, events]);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
