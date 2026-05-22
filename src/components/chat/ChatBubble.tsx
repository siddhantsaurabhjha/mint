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
  isSelected: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
  reply?: ChatMessage | null;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, value: string) => void;
  onOpenMedia: (url: string) => void;
  onSelect: (message: ChatMessage) => void;
};

export default function ChatBubble({
  message,
  isOwn,
  isSelected,
  groupedWithPrev,
  groupedWithNext,
  reply,
  onReply,
  onReact,
  onOpenMedia,
  onSelect,
}: ChatBubbleProps) {
  const startXRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    triggeredRef.current = false;
    if (holdRef.current) {
      clearTimeout(holdRef.current);
    }
    holdRef.current = setTimeout(() => {
      if (!triggeredRef.current) {
        onSelect(message);
      }
    }, 420);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || triggeredRef.current) return;
    const delta = event.clientX - startXRef.current;
    if (delta > SWIPE_THRESHOLD) {
      triggeredRef.current = true;
      if (holdRef.current) {
        clearTimeout(holdRef.current);
        holdRef.current = null;
      }
      onReply(message);
    }
  };

  const handlePointerUp = () => {
    startXRef.current = null;
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
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
          isOwn={isOwn}
          groupedWithPrev={groupedWithPrev}
          groupedWithNext={groupedWithNext}
          isSelected={isSelected}
        />
      );
    }
    if (message.type === "voice" && message.media_url) {
      return (
        <ChatVoiceBubble
          message={message}
          timeLabel={formatTime(message.created_at)}
          statusLabel={tickState()?.label ?? null}
          statusTone={tickState()?.tone}
          isOwn={isOwn}
        />
      );
    }
    return null;
  };

  const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const timeLabel = formatTime(message.created_at);
  const bubbleRadius = isOwn
    ? `rounded-2xl ${groupedWithPrev ? "rounded-tr-lg" : ""} ${
        groupedWithNext ? "rounded-br-lg" : ""
      }`
    : `rounded-2xl ${groupedWithPrev ? "rounded-tl-lg" : ""} ${
        groupedWithNext ? "rounded-bl-lg" : ""
      }`;

  return (
    <div
      className={`relative flex ${isOwn ? "justify-end" : "justify-start"} ${
        groupedWithPrev ? "mt-1" : "mt-3"
      }`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`relative max-w-[82%] px-3 py-2 text-[13px] leading-relaxed shadow-[0_16px_30px_rgba(0,0,0,0.35)] ${bubbleRadius} ${
          isOwn
            ? "bg-emerald-500/20 text-emerald-50"
            : "bg-white/8 text-white/90"
        } ${isSelected ? "ring-2 ring-emerald-300/50" : ""}`}
        style={{ touchAction: "pan-y" }}
      >
        {isSelected ? (
          <div className="absolute -top-10 left-0 flex w-full justify-center">
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2 py-1 text-sm text-white shadow-lg">
              {reactionOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onReact(message, value)}
                  className="rounded-full px-2 py-1 transition hover:bg-white/10"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {reply ? (
          <div className="mb-2 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/70">
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
          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-white/50">
            <span>{timeLabel}</span>
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
                className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white/80"
              >
                {reaction.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
