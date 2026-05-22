import type { ChatMessage } from "@/lib/chat/types";
import { CACHE_KEY_PREFIX, MESSAGE_LIMIT } from "@/lib/chat/constants";

const buildKey = (roomId: string) => `${CACHE_KEY_PREFIX}:${roomId}`;

export function readCachedMessages(roomId: string) {
  if (typeof window === "undefined") {
    return [] as ChatMessage[];
  }

  const raw = window.localStorage.getItem(buildKey(roomId));
  if (!raw) {
    return [] as ChatMessage[];
  }

  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed;
  } catch {
    return [] as ChatMessage[];
  }
}

export function writeCachedMessages(roomId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = messages.slice(-MESSAGE_LIMIT);
  window.localStorage.setItem(buildKey(roomId), JSON.stringify(trimmed));
}
