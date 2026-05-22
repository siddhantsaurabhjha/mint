"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatInputBar from "@/components/chat/ChatInputBar";
import ChatMediaPreview from "@/components/chat/ChatMediaPreview";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import ChatTimeline from "@/components/chat/ChatTimeline";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import MediaViewer from "@/components/media/MediaViewer";
import StoriesRail from "@/components/stories/StoriesRail";
import { useAuth } from "@/components/AuthProvider";
import type { ChatMessage } from "@/lib/chat/types";
import { useChatRoom } from "@/lib/chat/useChatRoom";
import { formatDateLabel, formatTime } from "@/lib/chat/utils";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { getUploadSignature, uploadToCloudinary } from "@/lib/media/upload";

const IMAGE_FOLDER = "lumen-duo/chat-images";
const VOICE_FOLDER = "lumen-duo/voice-notes";

export default function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const email = user?.email ?? null;
  const currentUsername = email ? resolveUsernameFromEmail(email) : null;
  const {
    messages,
    isLoading,
    typingNames,
    onlineUsers,
    lastSeen,
    sendMessage,
    deleteMessage,
    notifyTyping,
    sendReaction,
    updateMessage,
  } = useChatRoom({ userId, email });

  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const replyMap = useMemo(
    () =>
      messages.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, ChatMessage>),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingNames.length]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const partnerOnline = onlineUsers.some((item) => item.user_id !== userId);
  const partnerId = useMemo(() => {
    if (!userId) return null;
    const ids = Object.keys(lastSeen).filter((id) => id !== userId);
    return ids[0] ?? null;
  }, [lastSeen, userId]);
  const partnerName = useMemo(() => {
    const fromPresence = onlineUsers.find((item) => item.user_id !== userId)?.username;
    if (fromPresence) return fromPresence;
    const fromMessage = [...messages]
      .reverse()
      .find((item) => item.sender_id !== userId)?.sender_username;
    return fromMessage ?? "Partner";
  }, [messages, onlineUsers, userId]);
  const partnerInitials = partnerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const formatLastSeen = (value: string) => {
    const label = formatDateLabel(value);
    const time = formatTime(value);
    if (label === "Today") return `Last seen today at ${time}`;
    if (label === "Yesterday") return `Last seen yesterday at ${time}`;
    return `Last seen ${label} at ${time}`;
  };

  const presenceSubtitle = typingNames.length
    ? `${typingNames.join(", ")} typing...`
    : partnerOnline
    ? "Online now"
    : partnerId && lastSeen[partnerId]
    ? formatLastSeen(lastSeen[partnerId])
    : "Offline";

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      if (editingMessage) {
        await updateMessage({ messageId: editingMessage.id, body: trimmed });
        setEditingMessage(null);
        setSelectedMessageId(null);
      } else {
        await sendMessage({
          body: trimmed,
          replyTo: replyTo?.id ?? null,
        });
        setReplyTo(null);
      }
      setMessage("");
      setShowEmojiPicker(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setPreviewSrc(URL.createObjectURL(file));
    setUploadProgress(null);
    event.target.value = "";
  };

  const handleSendImage = async () => {
    if (!pendingImage || isSending) return;
    setIsSending(true);
    setUploadProgress(0);
    try {
      const signature = await getUploadSignature(IMAGE_FOLDER, "image");
      const result = await uploadToCloudinary(signature, pendingImage, setUploadProgress);
      await sendMessage({
        body: message.trim(),
        replyTo: replyTo?.id ?? null,
        type: "image",
        mediaUrl: result.url,
        mediaPublicId: result.publicId,
        mediaMeta: {
          width: result.width,
          height: result.height,
          format: result.format,
        },
      });
      setMessage("");
      setReplyTo(null);
      setSelectedMessageId(null);
      setEditingMessage(null);
      setPreviewSrc(null);
      setPendingImage(null);
    } finally {
      setUploadProgress(null);
      setIsSending(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewSrc(null);
    setPendingImage(null);
    setUploadProgress(null);
  };

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  );

  const handleSelectMessage = (item: ChatMessage) => {
    setSelectedMessageId(item.id);
    setShowEmojiPicker(false);
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) return;
    const text = selectedMessage.body || selectedMessage.media_url || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
    setSelectedMessageId(null);
  };

  const handleEditMessage = () => {
    if (!selectedMessage || selectedMessage.type !== "text") return;
    setEditingMessage(selectedMessage);
    setMessage(selectedMessage.body ?? "");
    setReplyTo(null);
    setSelectedMessageId(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    await deleteMessage(selectedMessage.id);
    setSelectedMessageId(null);
  };

  const handleReactMessage = (item: ChatMessage, value: string) => {
    sendReaction({ messageId: item.id, value });
    setSelectedMessageId(null);
  };

  const handleRecorded = async (
    blob: Blob,
    duration: number,
    waveform: number[]
  ) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      const signature = await getUploadSignature(VOICE_FOLDER, "video");
      const result = await uploadToCloudinary(signature, file, setUploadProgress);
      await sendMessage({
        body: "",
        replyTo: replyTo?.id ?? null,
        type: "voice",
        mediaUrl: result.url,
        mediaPublicId: result.publicId,
        mediaMeta: { duration, waveform },
      });
      setReplyTo(null);
    } finally {
      setIsRecording(false);
      setUploadProgress(null);
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-140px)] w-full max-w-md flex-col gap-4">
      <header className="sticky top-0 z-30 rounded-3xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white">
              {partnerInitials || "LU"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{partnerName}</p>
              <p className="truncate text-xs text-white/60">{presenceSubtitle}</p>
            </div>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
              partnerOnline
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/15 bg-white/5 text-white/60"
            }`}
          >
            {partnerOnline ? "Online" : "Offline"}
          </div>
        </div>
        {selectedMessage ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            <span className="truncate">1 selected</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
              >
                Copy
              </button>
              {selectedMessage.sender_id === userId && selectedMessage.type === "text" ? (
                <button
                  type="button"
                  onClick={handleEditMessage}
                  className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100"
                >
                  Edit
                </button>
              ) : null}
              {selectedMessage.sender_id === userId ? (
                <button
                  type="button"
                  onClick={handleDeleteMessage}
                  className="rounded-full border border-rose-300/40 bg-rose-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-100"
                >
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedMessageId(null)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <StoriesRail />

      <section className="flex flex-1 flex-col gap-3">
        <div
          className="flex-1 space-y-4 overflow-y-auto scroll-smooth px-1 pb-4"
          onClick={() => {
            setSelectedMessageId(null);
            setShowEmojiPicker(false);
          }}
        >
          {isLoading && messages.length === 0 ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
              No messages yet. Send the first spark.
            </div>
          ) : (
            <ChatTimeline
              messages={messages}
              currentUserId={userId}
              currentUsername={currentUsername}
              replyMap={replyMap}
              selectedMessageId={selectedMessageId}
              onReply={setReplyTo}
              onReact={handleReactMessage}
              onOpenMedia={setActiveMedia}
              onSelectMessage={handleSelectMessage}
            />
          )}
          {typingNames.length > 0 ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
              {typingNames.join(", ")} typing...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {isRecording ? (
          <VoiceRecorder
            onRecorded={handleRecorded}
            onCancel={() => setIsRecording(false)}
          />
        ) : null}

        {showEmojiPicker ? (
          <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-lg text-white">
            {["😀", "😅", "😂", "😍", "👍", "🙏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMessage((prev) => `${prev}${emoji}`)}
                className="px-2 py-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="sticky bottom-[calc(92px+env(safe-area-inset-bottom))]">
          <ChatInputBar
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onTyping={notifyTyping}
            onPickImage={() => fileInputRef.current?.click()}
            onToggleEmoji={() => setShowEmojiPicker((prev) => !prev)}
            onToggleRecorder={() => setIsRecording((prev) => !prev)}
            isRecording={isRecording}
            replyTo={replyTo}
            editMessage={editingMessage}
            onClearReply={() => setReplyTo(null)}
            onClearEdit={() => {
              setEditingMessage(null);
              setMessage("");
            }}
            emojiActive={showEmojiPicker}
            disabled={isSending}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </section>

      <ChatMediaPreview
        src={previewSrc}
        onCancel={handleCancelPreview}
        onSend={handleSendImage}
        progress={uploadProgress}
      />
      <MediaViewer src={activeMedia} onClose={() => setActiveMedia(null)} />
    </div>
  );
}