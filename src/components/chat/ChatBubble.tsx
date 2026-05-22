"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { formatTime } from "@/lib/chat/utils";
import { useRef } from "react";

import ChatImageBubble from "@/components/chat/ChatImageBubble";
import ChatVoiceBubble from "@/components/chat/ChatVoiceBubble";

const SWIPE_THRESHOLD = 60;

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  reply?: ChatMessage | null;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onOpenMedia: (url: string) => void;
};

export default function ChatBubble({
  message,
  isOwn,
  reply,
  onReply,
  onReact,
  onDelete,
  onOpenMedia,
}: ChatBubbleProps) {
  const startXRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    triggeredRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || triggeredRef.current) return;
    const delta = event.clientX - startXRef.current;
    if (delta > SWIPE_THRESHOLD) {
      triggeredRef.current = true;
      onReply(message);
    }
  };

  const handlePointerUp = () => {
    startXRef.current = null;
  };

  const tickState = () => {
    if (!isOwn) return null;
    if (message.seen_at) return { label: "vv", tone: "text-accent" };
    if (message.delivered_at) return { label: "vv", tone: "text-white/60" };
    return { label: "v", tone: "text-white/35" };
  };

  const renderBody = () => {
    if (message.type === "image") return "[Image placeholder]";
    if (message.type === "voice") return "[Voice placeholder]";
    return message.body ?? "";
  };

  const renderMedia = () => {
    if (message.type === "image" && message.media_url) {
      const tick = tickState();
      return (
        <ChatImageBubble
          message={message}
          onOpen={onOpenMedia}
          timeLabel={formatTime(message.created_at)}
          statusLabel={tick?.label ?? null}
          statusTone={tick?.tone}
        />
      );
    }
    if (message.type === "voice" && message.media_url) {
      return <ChatVoiceBubble message={message} />;
    }
    return null;
  };

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-[0_12px_26px_rgba(0,0,0,0.25)] ${
          isOwn
            ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] text-white"
            : "bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-white/85"
        }`}
        style={{ touchAction: "pan-y" }}
      >
        {reply ? (
          <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
            <span className="font-semibold">{reply.sender_username}</span> •{" "}
            {reply.body ?? reply.type}
          </div>
        ) : null}
        {renderMedia()}
        {message.type === "text" ? <p>{renderBody()}</p> : null}
        {message.type !== "text" && message.body ? (
          <p className="mt-2 text-[11px] text-white/75">{message.body}</p>
        ) : null}
        {message.type !== "image" ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-white/50">
            <span>{formatTime(message.created_at)}</span>
            {isOwn ? (() => {
              const tick = tickState();
              return tick ? <span className={tick.tone}>{tick.label}</span> : null;
            })() : null}
          </div>
        ) : null}
        {message.reactions && message.reactions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction, index) => (
              <span
                key={`${reaction.value}-${index}`}
                className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/70"
              >
                {reaction.value}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onReact(message)}
            className="text-[10px] uppercase tracking-[0.2em] text-white/40"
          >
            React
          </button>
          {isOwn ? (
            <button
              type="button"
              onClick={() => onDelete(message)}
              className="text-[10px] uppercase tracking-[0.2em] text-white/40"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
