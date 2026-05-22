
"use client";

import type { KeyboardEvent } from "react";
import type { ChatMessage } from "@/lib/chat/types";

type ChatInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onPickImage: () => void;
  onToggleRecorder: () => void;
  isRecording: boolean;
  replyTo?: ChatMessage | null;
  onClearReply: () => void;
  disabled?: boolean;
};

export default function ChatInputBar({
  value,
  onChange,
  onSend,
  onTyping,
  onPickImage,
  onToggleRecorder,
  isRecording,
  replyTo,
  onClearReply,
  disabled = false,
}: ChatInputBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      {replyTo ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
          <div className="min-w-0">
            <p className="font-semibold text-white/80">
              Replying to {replyTo.sender_username}
            </p>
            <p className="truncate text-white/60">{replyTo.body ?? replyTo.type}</p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPickImage}
          disabled={disabled}
          className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 disabled:opacity-50"
        >
          Photo
        </button>
        <button
          type="button"
          onClick={onToggleRecorder}
          disabled={disabled}
          className={`rounded-2xl border px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition disabled:opacity-50 ${
            isRecording
              ? "border-white/30 bg-white/20 text-white"
              : "border-white/15 bg-white/5 text-white/70"
          }`}
        >
          {isRecording ? "Stop" : "Voice"}
        </button>
        <textarea
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a message"
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-2xl bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
