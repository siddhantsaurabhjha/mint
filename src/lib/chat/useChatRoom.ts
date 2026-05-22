"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ChatMessage } from "@/lib/chat/types";
import { MESSAGE_LIMIT, ROOM_ID } from "@/lib/chat/constants";
import { readCachedMessages, writeCachedMessages } from "@/lib/chat/cache";
import { isAllowedEmail, resolveUsernameFromEmail } from "@/lib/auth";
import { sendPushNotification } from "@/lib/pwa/push";

const TYPING_EVENT = "typing";
const REACTION_EVENT = "reaction";

type PresenceState = {
  user_id: string;
  username: string;
  is_online: boolean;
  last_seen: string;
};

type TypingState = Record<string, { username: string; updatedAt: number }>;

type UseChatRoomOptions = {
  userId: string;
  email: string | null | undefined;
};

export function useChatRoom({ userId, email }: UseChatRoomOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typing, setTyping] = useState<TypingState>({});
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const username = email ? resolveUsernameFromEmail(email) : null;
  const allowed = isAllowedEmail(email);

  const upsertMessages = useCallback((next: ChatMessage[]) => {
    setMessages((prev) => {
      const merged = [...prev];
      next.forEach((message) => {
        const index = merged.findIndex((item) => item.id === message.id);
        if (index === -1) {
          merged.push(message);
        } else {
          merged[index] = { ...merged[index], ...message };
        }
      });
      merged.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return merged.slice(-MESSAGE_LIMIT);
    });
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  }, []);

  const markDeliveredAndSeen = useCallback(
    async (items: ChatMessage[]) => {
      const supabase = getSupabaseBrowserClient();
      const updates = items.filter((message) => message.sender_id !== userId);

      if (updates.length === 0) return;

      await Promise.all(
        updates.map((message) =>
          supabase
            .from("chat_messages")
            .update({
              delivered_at: message.delivered_at ?? new Date().toISOString(),
              seen_at: new Date().toISOString(),
            })
            .eq("id", message.id)
        )
      );
    },
    [userId]
  );

  useEffect(() => {
    const cached = readCachedMessages(ROOM_ID);
    if (cached.length) {
      setMessages(cached);
    }
  }, []);

  useEffect(() => {
    if (!userId || !allowed) return undefined;
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", ROOM_ID)
      .order("created_at", { ascending: true })
      .limit(MESSAGE_LIMIT)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && data) {
          upsertMessages(data as ChatMessage[]);
          markDeliveredAndSeen(data as ChatMessage[]);
        }
        setIsLoading(false);
      });

    const channel = supabase.channel(`room:${ROOM_ID}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${ROOM_ID}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;
          upsertMessages([next]);
          markDeliveredAndSeen([next]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${ROOM_ID}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;
          upsertMessages([next]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${ROOM_ID}`,
        },
        (payload) => {
          const removed = payload.old as ChatMessage;
          removeMessage(removed.id);
        }
      )
      .on("broadcast", { event: TYPING_EVENT }, ({ payload }) => {
        const { user_id: typingUserId, username: typingName, is_typing } = payload as {
          user_id: string;
          username: string;
          is_typing: boolean;
        };

        if (typingUserId === userId) return;

        setTyping((prev) => {
          const copy = { ...prev };
          if (!is_typing) {
            delete copy[typingUserId];
            return copy;
          }
          copy[typingUserId] = { username: typingName, updatedAt: Date.now() };
          return copy;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTyping((prev) => {
            const copy = { ...prev };
            delete copy[typingUserId];
            return copy;
          });
        }, 2500);
      });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      isMounted = false;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, username, markDeliveredAndSeen, upsertMessages, removeMessage]);

  useEffect(() => {
    if (!userId || !username || !allowed) return undefined;
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;
    let heartbeatId: ReturnType<typeof setInterval> | null = null;

    const applyPresenceState = (state: PresenceState) => {
      if (!isMounted) return;
      setOnlineUsers((prev) => {
        const map = new Map(prev.map((item) => [item.user_id, item]));
        map.set(state.user_id, state);
        return Array.from(map.values()).filter((item) => item.is_online);
      });
      setLastSeen((prev) => ({
        ...prev,
        [state.user_id]: state.last_seen,
      }));
    };

    const updatePresence = async (isOnline: boolean) => {
      const payload = {
        user_id: userId,
        username,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data } = await supabase
        .from("user_presence")
        .update(payload)
        .eq("user_id", userId)
        .select("id");

      if (!data || data.length === 0) {
        await supabase.from("user_presence").insert(payload);
      }
    };

    supabase
      .from("user_presence")
      .select("user_id, username, is_online, last_seen")
      .then(({ data }) => {
        if (!data) return;
        data.forEach((item) => applyPresenceState(item as PresenceState));
      });

    const presenceChannel = supabase.channel(`presence-db:${ROOM_ID}`);
    presenceChannel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        (payload) => {
          const next = payload.new as PresenceState;
          applyPresenceState(next);
        }
      )
      .subscribe();

    presenceChannelRef.current = presenceChannel;

    const handleVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      updatePresence(isVisible);
    };

    const handlePageHide = () => {
      updatePresence(false);
    };

    updatePresence(true);
    heartbeatId = setInterval(() => {
      updatePresence(true);
    }, 5000);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      isMounted = false;
      presenceChannelRef.current?.unsubscribe();
      presenceChannelRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      updatePresence(false);
    };
  }, [userId, username]);

  useEffect(() => {
    writeCachedMessages(ROOM_ID, messages);
  }, [messages]);

  const sendMessage = useCallback(
    async ({
      body,
      replyTo,
      type,
      mediaUrl,
      mediaPublicId,
      mediaMeta,
    }: {
      body: string;
      replyTo?: string | null;
      type?: "text" | "image" | "voice";
      mediaUrl?: string | null;
      mediaPublicId?: string | null;
      mediaMeta?: Record<string, unknown> | null;
    }) => {
      if (!userId || !username || !allowed) {
        return { data: null, error: { message: "User not allowed." } };
      }
      const supabase = getSupabaseBrowserClient();
      const payload: Record<string, unknown> = {
        room_id: ROOM_ID,
        sender_id: userId,
        sender_username: username,
        body: body ? body : null,
        type: type ?? "text",
        reply_to: replyTo ?? null,
      };

      if (mediaUrl) {
        payload.media_url = mediaUrl;
      }

      if (mediaMeta) {
        payload.media_meta = mediaMeta;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert(payload)
        .select("*")
        .single();

      if (!error && data) {
        upsertMessages([data as ChatMessage]);
        await sendPushNotification({
          title: "New message",
          body: body || "Sent a media message",
          url: "/chat",
          tag: "chat-message",
          senderId: userId,
          badge: 1,
        });
      }

      return { data, error };
    },
    [userId, username, allowed, upsertMessages]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!userId) return;
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);
      removeMessage(messageId);
    },
    [userId, removeMessage]
  );

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !username) return;

      channelRef.current.send({
        type: "broadcast",
        event: TYPING_EVENT,
        payload: {
          user_id: userId,
          username,
          is_typing: isTyping,
        },
      });
    },
    [userId, username]
  );

  const notifyTyping = useCallback(() => {
    if (!channelRef.current || !username) return;

    broadcastTyping(true);

    if (typingBroadcastRef.current) {
      clearTimeout(typingBroadcastRef.current);
    }

    typingBroadcastRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 1200);
  }, [broadcastTyping, username]);

  const sendReaction = useCallback(
    async ({ messageId, value }: { messageId: string; value: string }) => {
      const supabase = getSupabaseBrowserClient();
      const message = messages.find((item) => item.id === messageId);
      if (!message) return;

      const reactions = message.reactions ? [...message.reactions] : [];
      reactions.push({ value, by: userId });

      const { data, error } = await supabase
        .from("chat_messages")
        .update({ reactions })
        .eq("id", messageId)
        .select("*")
        .single();

      if (!error && data) {
        upsertMessages([data as ChatMessage]);
      }

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: REACTION_EVENT,
          payload: { message_id: messageId, value },
        });
      }
    },
    [messages, userId, upsertMessages]
  );

  const typingNames = useMemo(
    () => Object.values(typing).map((item) => item.username),
    [typing]
  );

  return {
    messages,
    isLoading,
    typingNames,
    onlineUsers,
    lastSeen,
    sendMessage,
    deleteMessage,
    notifyTyping,
    sendReaction,
  };
}
