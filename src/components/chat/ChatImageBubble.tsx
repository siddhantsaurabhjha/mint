"use client";

import type { ChatMessage } from "@/lib/chat/types";
import type { ComponentType } from "react";
import { useState } from "react";

export default function ChatImageBubble({
  message,
  onOpen,
  timeLabel,
  statusLabel,
  statusTone,
  statusIcon,
  isOwn,
  groupedWithPrev,
  groupedWithNext,
  isSelected,
}: {
  message: ChatMessage;
  onOpen: (url: string) => void;
  timeLabel?: string;
  statusLabel?: string | null;
  statusTone?: string;
  statusIcon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null;
  isOwn: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
  isSelected: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  if (!message.media_url) return null;

  const bubbleRadius = isOwn
    ? `rounded-2xl ${groupedWithPrev ? "rounded-tr-lg" : ""} ${
        groupedWithNext ? "rounded-br-lg" : ""
      }`
    : `rounded-2xl ${groupedWithPrev ? "rounded-tl-lg" : ""} ${
        groupedWithNext ? "rounded-bl-lg" : ""
      }`;

  return (
    <button
      type="button"
      onClick={() => onOpen(message.media_url ?? "")}
      className={`group relative w-56 max-w-full overflow-hidden border border-white/10 ${bubbleRadius} ${
        isSelected ? "ring-2 ring-emerald-300/50" : ""
      }`}
    >
      <img
        src={message.media_url}
        alt="Shared"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`h-52 w-full object-cover transition duration-700 ${
          isLoaded ? "blur-0" : "blur-[10px]"
        }`}
      />
      <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100" />
      {timeLabel ? (
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
          <div className="flex items-center justify-end gap-1 text-[10px] text-white/85">
            <span>{timeLabel}</span>
            {statusIcon ? (() => {
              const StatusIcon = statusIcon;
              return <StatusIcon size={12} strokeWidth={2.4} className={statusTone ?? "text-white/70"} />;
            })() : statusLabel ? <span className={statusTone ?? "text-white/70"}>{statusLabel}</span> : null}
          </div>
        </div>
      ) : null}
    </button>
  );
}
