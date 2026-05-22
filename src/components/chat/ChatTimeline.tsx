"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { groupByDate } from "@/lib/chat/utils";
import ChatBubble from "@/components/chat/ChatBubble";

type ChatTimelineProps = {
  messages: ChatMessage[];
  currentUserId: string;
  currentUsername?: string | null;
  replyMap: Record<string, ChatMessage>;
  selectedMessageId: string | null;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, value: string) => void;
  onOpenMedia: (url: string) => void;
  onSelectMessage: (message: ChatMessage) => void;
};

export default function ChatTimeline({
  messages,
  currentUserId,
  currentUsername,
  replyMap,
  selectedMessageId,
  onReply,
  onReact,
  onOpenMedia,
  onSelectMessage,
}: ChatTimelineProps) {
  const groups = groupByDate(messages);
  const isGroupedWith = (a?: ChatMessage, b?: ChatMessage) => {
    if (!a || !b) return false;
    if (a.sender_id !== b.sender_id) return false;
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return Math.abs(aTime - bTime) < 5 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-4">
          <div className="flex items-center justify-center">
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60">
              {group.label}
            </span>
          </div>
          <div className="space-y-3">
            {group.items.map((message, index) => {
              const prev = group.items[index - 1];
              const next = group.items[index + 1];
              const groupedWithPrev = isGroupedWith(prev, message);
              const groupedWithNext = isGroupedWith(message, next);
              return (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={
                  (currentUserId && message.sender_id === currentUserId) ||
                  (!!currentUsername && message.sender_username === currentUsername)
                }
                isSelected={selectedMessageId === message.id}
                groupedWithPrev={groupedWithPrev}
                groupedWithNext={groupedWithNext}
                reply={replyMap[message.reply_to ?? ""]}
                onReply={onReply}
                onReact={onReact}
                onOpenMedia={onOpenMedia}
                onSelect={onSelectMessage}
              />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
