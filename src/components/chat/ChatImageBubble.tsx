"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { useState } from "react";

export default function ChatImageBubble({
  message,
  onOpen,
  timeLabel,
  statusLabel,
  statusTone,
}: {
  message: ChatMessage;
  onOpen: (url: string) => void;
  timeLabel?: string;
  statusLabel?: string | null;
  statusTone?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  if (!message.media_url) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(message.media_url ?? "")}
      className="group relative w-52 max-w-full overflow-hidden rounded-2xl border border-white/10"
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
          <div className="flex items-center justify-end gap-1 text-[10px] text-white/85">
            <span>{timeLabel}</span>
            {statusLabel ? (
              <span className={statusTone ?? "text-white/70"}>{statusLabel}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </button>
  );
}
