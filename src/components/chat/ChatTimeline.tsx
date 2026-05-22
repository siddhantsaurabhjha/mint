"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { groupByDate } from "@/lib/chat/utils";
import ChatBubble from "@/components/chat/ChatBubble";

type ChatTimelineProps = {
  messages: ChatMessage[];
  currentUserId: string;
  currentUsername?: string | null;
  replyMap: Record<string, ChatMessage>;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onOpenMedia: (url: string) => void;
};

export default function ChatTimeline({
  messages,
  currentUserId,
  currentUsername,
  replyMap,
  onReply,
  onReact,
  onDelete,
  onOpenMedia,
}: ChatTimelineProps) {
  const groups = groupByDate(messages);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-4">
          <div className="flex items-center justify-center">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60">
              {group.label}
            </span>
          </div>
          <div className="space-y-3">
            {group.items.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={
                  (currentUserId && message.sender_id === currentUserId) ||
                  (!!currentUsername && message.sender_username === currentUsername)
                }
                reply={replyMap[message.reply_to ?? ""]}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDelete}
                onOpenMedia={onOpenMedia}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
