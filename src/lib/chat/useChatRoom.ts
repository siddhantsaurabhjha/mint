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
const PROFILE_EVENT = "profile";
const PROFILE_SYNC_REQUEST_EVENT = "profile-sync-request";

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
  profileSnapshot?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    mood?: string | null;
  };
};

type ProfileSnapshot = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  mood: string | null;
  updatedAt: string;
};

function toNotificationName(raw: string | null | undefined) {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return "Partner";
  if (value === "sid") return "Sid";
  if (value === "laxu") return "Laxmi";
  return value[0].toUpperCase() + value.slice(1);
}

export function useChatRoom({ userId, email, profileSnapshot }: UseChatRoomOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typing, setTyping] = useState<TypingState>({});
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const [profileByUserId, setProfileByUserId] = useState<Record<string, ProfileSnapshot>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushedMessageIdsRef = useRef<Set<string>>(new Set());
  const username = email ? resolveUsernameFromEmail(email) : null;
  const allowed = isAllowedEmail(email);

  const ownProfileSnapshot = useMemo(() => {
    const normalize = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };

    const fallbackDisplayName = username ? username : "Partner";
    return {
      displayName: normalize(profileSnapshot?.displayName) ?? fallbackDisplayName,
      avatarUrl: normalize(profileSnapshot?.avatarUrl),
      bio: normalize(profileSnapshot?.bio),
      mood: normalize(profileSnapshot?.mood),
      updatedAt: new Date().toISOString(),
    };
  }, [profileSnapshot?.avatarUrl, profileSnapshot?.bio, profileSnapshot?.displayName, profileSnapshot?.mood, username]);

  const upsertProfileSnapshot = useCallback((nextUserId: string, next: ProfileSnapshot) => {
    if (!nextUserId) return;
    setProfileByUserId((prev) => {
      const current = prev[nextUserId];
      if (
        current &&
        current.displayName === next.displayName &&
        current.avatarUrl === next.avatarUrl &&
        current.bio === next.bio &&
        current.mood === next.mood
      ) {
        return prev;
      }
      return {
        ...prev,
        [nextUserId]: next,
      };
    });
  }, []);

  const broadcastProfileSnapshot = useCallback(() => {
    if (!channelRef.current || !userId) return;
    channelRef.current.send({
      type: "broadcast",
      event: PROFILE_EVENT,
      payload: {
        user_id: userId,
        ...ownProfileSnapshot,
      },
    });
  }, [ownProfileSnapshot, userId]);

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

          if (next.sender_id === userId && !pushedMessageIdsRef.current.has(next.id)) {
            pushedMessageIdsRef.current.add(next.id);
            const senderName = toNotificationName(next.sender_username);
            void sendPushNotification({
              title: "MINT",
              body: `${senderName} sent a message`,
              url: "/chat",
              tag: `mint-chat-${next.id}`,
              senderId: userId,
              badge: 1,
            });
          }
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
      })
      .on("broadcast", { event: PROFILE_EVENT }, ({ payload }) => {
        const nextPayload = payload as {
          user_id: string;
          displayName?: string;
          avatarUrl?: string | null;
          bio?: string | null;
          mood?: string | null;
          updatedAt?: string;
        };

        if (!nextPayload.user_id) return;

        upsertProfileSnapshot(nextPayload.user_id, {
          displayName: nextPayload.displayName?.trim() || "Partner",
          avatarUrl: nextPayload.avatarUrl ?? null,
          bio: nextPayload.bio ?? null,
          mood: nextPayload.mood ?? null,
          updatedAt: nextPayload.updatedAt ?? new Date().toISOString(),
        });
      })
      .on("broadcast", { event: PROFILE_SYNC_REQUEST_EVENT }, ({ payload }) => {
        const nextPayload = payload as { requester_user_id?: string; target_user_id?: string };
        if (!nextPayload.requester_user_id || nextPayload.requester_user_id === userId) return;
        if (nextPayload.target_user_id !== userId) return;
        broadcastProfileSnapshot();
      });

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      broadcastProfileSnapshot();
      if (!userId) return;
      channel.send({
        type: "broadcast",
        event: PROFILE_SYNC_REQUEST_EVENT,
        payload: {
          requester_user_id: userId,
        },
      });
    });
    channelRef.current = channel;

    return () => {
      isMounted = false;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, username, markDeliveredAndSeen, upsertMessages, removeMessage, upsertProfileSnapshot, broadcastProfileSnapshot]);

  useEffect(() => {
    if (!userId) return;
    upsertProfileSnapshot(userId, ownProfileSnapshot);
    broadcastProfileSnapshot();
  }, [broadcastProfileSnapshot, ownProfileSnapshot, upsertProfileSnapshot, userId]);

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

  const updateMessage = useCallback(
    async ({ messageId, body }: { messageId: string; body: string }) => {
      if (!userId) return { data: null, error: { message: "User not allowed." } };
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .update({ body })
        .eq("id", messageId)
        .eq("sender_id", userId)
        .select("*")
        .single();

      if (!error && data) {
        upsertMessages([data as ChatMessage]);
      }

      return { data, error };
    },
    [userId, upsertMessages]
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
    profileByUserId,
    sendMessage,
    deleteMessage,
    notifyTyping,
    sendReaction,
    updateMessage,
  };
}
