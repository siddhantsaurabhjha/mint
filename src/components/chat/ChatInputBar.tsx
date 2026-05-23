
"use client";

import type { KeyboardEvent } from "react";
import type { ChatMessage } from "@/lib/chat/types";

type ChatInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onPickImage: () => void;
  onToggleEmoji: () => void;
  onToggleRecorder: () => void;
  isRecording: boolean;
  replyTo?: ChatMessage | null;
  editMessage?: ChatMessage | null;
  onClearReply: () => void;
  onClearEdit: () => void;
  emojiActive?: boolean;
  disabled?: boolean;
};

export default function ChatInputBar({
  value,
  onChange,
  onSend,
  onTyping,
  onPickImage,
  onToggleEmoji,
  onToggleRecorder,
  isRecording,
  replyTo,
  editMessage,
  onClearReply,
  onClearEdit,
  emojiActive = false,
  disabled = false,
}: ChatInputBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(27,18,43,0.98),rgba(17,11,28,0.98))] p-3 shadow-[0_18px_36px_rgba(0,0,0,0.42)]">
      {editMessage ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] text-emerald-100">
          <div className="min-w-0">
            <p className="font-semibold text-emerald-100">Editing message</p>
            <p className="truncate text-emerald-100/70">{editMessage.body ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={onClearEdit}
            className="rounded-full border border-emerald-200/40 bg-emerald-200/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
          >
            Cancel
          </button>
        </div>
      ) : replyTo ? (
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

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onPickImage}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition active:scale-95 disabled:opacity-50"
          aria-label="Attach"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-3">
          <button
            type="button"
            onClick={onToggleEmoji}
            disabled={disabled}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-50 ${
              emojiActive
                ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-white/70"
            }`}
            aria-label="Emoji"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8 14c1.2 1.2 2.6 1.8 4 1.8s2.8-.6 4-1.8" />
              <path d="M9 10h.01" />
              <path d="M15 10h.01" />
            </svg>
          </button>
          <textarea
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onToggleRecorder}
            disabled={disabled}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-50 ${
              isRecording
                ? "border-white/30 bg-white/20 text-white"
                : "border-white/10 bg-white/5 text-white/70"
            }`}
            aria-label={isRecording ? "Stop" : "Voice"}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v2" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-300/20 text-emerald-100 transition active:scale-95 disabled:opacity-50"
          aria-label="Send"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 12l15-7-5 7 5 7-15-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
