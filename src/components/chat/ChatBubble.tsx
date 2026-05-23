"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { formatTime } from "@/lib/chat/utils";
import { useRef } from "react";
import { MoreVertical, Check, CheckCheck } from "lucide-react";

import ChatImageBubble from "@/components/chat/ChatImageBubble";
import ChatVoiceBubble from "@/components/chat/ChatVoiceBubble";

const SWIPE_THRESHOLD = 60;

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  isSelected: boolean;
  isMenuOpen: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
  reply?: ChatMessage | null;
  onReply: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, value: string) => void;
  onOpenMedia: (url: string) => void;
  onSelect: (message: ChatMessage) => void;
  onOpenMenu: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
};

export default function ChatBubble({
  message,
  isOwn,
  isSelected,
  isMenuOpen,
  groupedWithPrev,
  groupedWithNext,
  reply,
  onReply,
  onReact,
  onOpenMedia,
  onSelect,
  onOpenMenu,
  onCopy,
  onEdit,
  onDelete,
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
    if (message.seen_at) return { icon: CheckCheck, tone: "text-sky-400" };
    if (message.delivered_at) return { icon: CheckCheck, tone: "text-white/55" };
    return { icon: Check, tone: "text-white/35" };
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
          statusTone={tick?.tone}
          statusIcon={tick?.icon ?? null}
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
          statusTone={tickState()?.tone}
          statusIcon={tickState()?.icon ?? null}
          isOwn={isOwn}
        />
      );
    }
    return null;
  };

  const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const timeLabel = formatTime(message.created_at);
  const bubbleRadius = isOwn
    ? `rounded-[22px] ${groupedWithPrev ? "rounded-tr-lg" : ""} ${
        groupedWithNext ? "rounded-br-lg" : ""
      }`
    : `rounded-[22px] ${groupedWithPrev ? "rounded-tl-lg" : ""} ${
        groupedWithNext ? "rounded-bl-lg" : ""
      }`;

  return (
    <div
      className={`group relative flex ${isOwn ? "justify-end" : "justify-start"} ${
        groupedWithPrev ? "mt-1" : "mt-3"
      }`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`relative inline-flex w-fit max-w-[78%] flex-col px-3 py-1.5 text-[13px] leading-[1.45] shadow-[0_18px_34px_rgba(0,0,0,0.32)] ${bubbleRadius} ${
          isOwn
            ? "bg-[linear-gradient(135deg,rgba(123,44,255,0.92),rgba(76,29,149,0.94))] text-white"
            : "bg-[linear-gradient(135deg,rgba(31,18,63,0.98),rgba(15,10,30,0.98))] text-white/92"
        } ${isSelected ? "ring-1 ring-fuchsia-200/15 shadow-[0_18px_34px_rgba(0,0,0,0.36),0_0_18px_rgba(153,90,255,0.12)]" : ""}`}
        style={{ touchAction: "pan-y" }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenMenu(message);
          }}
          className="absolute right-1 top-1 rounded-full p-1 text-white/45 opacity-70 transition hover:text-white/80"
          aria-label="Message actions"
        >
          <MoreVertical size={14} />
        </button>
        {isMenuOpen ? (
          <div className={`absolute right-2 top-7 z-30 w-32 overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-[0_14px_30px_rgba(0,0,0,0.45)] ${isOwn ? "origin-top-right" : "origin-top-left"}`}>
            <button type="button" onClick={() => onEdit(message)} className="w-full px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/5">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(message)} className="w-full px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/5">
              Delete
            </button>
            <button type="button" onClick={() => onCopy(message)} className="w-full px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/5">
              Copy
            </button>
          </div>
        ) : null}
        {isSelected ? (
          <div className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#11111a] px-2 py-1 shadow-[0_12px_26px_rgba(0,0,0,0.4)]">
            {reactionOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onReact(message, value)}
                className="rounded-full px-2 py-1 text-[15px] transition active:scale-95"
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}
        {reply ? (
          <div className="mb-1 rounded-2xl border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] leading-tight text-white/72">
            <div className="truncate">
              <span className="font-semibold">{reply.sender_username}</span> •{" "}
              <span className="truncate">{reply.body ?? reply.type}</span>
            </div>
          </div>
        ) : null}
        {renderMedia()}
        {message.type === "text" ? <p className="whitespace-pre-wrap wrap-break-word">{renderBody()}</p> : null}
        {message.type !== "text" && message.body ? (
          <p className="mt-2 text-[11px] text-white/75">{message.body}</p>
        ) : null}
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-white/50">
          <span>{timeLabel}</span>
          {isOwn ? (() => {
            const tick = tickState();
            if (!tick) return null;
            const TickIcon = tick.icon;
            return <TickIcon size={12} strokeWidth={2.4} className={tick.tone} />;
          })() : null}
        </div>
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
