"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatInputBar from "@/components/chat/ChatInputBar";
import ChatMediaPreview from "@/components/chat/ChatMediaPreview";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import ChatTimeline from "@/components/chat/ChatTimeline";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import MediaViewer from "@/components/media/MediaViewer";
import { useAuth } from "@/components/AuthProvider";
import type { ChatMessage } from "@/lib/chat/types";
import { useChatRoom } from "@/lib/chat/useChatRoom";
import { formatDateLabel, formatTime } from "@/lib/chat/utils";
import { resolveUsernameFromEmail } from "@/lib/auth";
import { getUploadSignature, uploadToCloudinary } from "@/lib/media/upload";

const IMAGE_FOLDER = "lumen-duo/chat-images";
const VOICE_FOLDER = "lumen-duo/voice-notes";

export default function ChatPage() {
  const router = useRouter();
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
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
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

  const menuMessage = useMemo(
    () => messages.find((item) => item.id === menuMessageId) ?? null,
    [menuMessageId, messages]
  );

  const handleSelectMessage = (item: ChatMessage) => {
    setSelectedMessageId(item.id);
    setMenuMessageId(null);
    setShowEmojiPicker(false);
  };

  const handleCopyMenuMessage = async (item: ChatMessage) => {
    const text = item.body || item.media_url || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
    setMenuMessageId(null);
  };

  const handleEditMenuMessage = (item: ChatMessage) => {
    if (item.type !== "text") return;
    setEditingMessage(item);
    setMessage(item.body ?? "");
    setReplyTo(null);
    setMenuMessageId(null);
  };

  const handleDeleteMenuMessage = async (item: ChatMessage) => {
    await deleteMessage(item.id);
    setMenuMessageId(null);
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
    <div className="relative mx-auto flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-md flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(16,9,28,1),rgba(8,6,16,1))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(118,61,255,0.16),transparent_42%),radial-gradient(circle_at_18%_20%,rgba(63,132,255,0.12),transparent_28%),radial-gradient(circle_at_80%_92%,rgba(159,68,255,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] opacity-50" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(48,22,73,0.98),rgba(28,13,42,0.98))] px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
        <button
          type="button"
          onClick={() => router.push("/stories")}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-fuchsia-300/20 bg-[#160d26] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_18px_rgba(139,92,246,0.18)]">
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              {partnerInitials || "LU"}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{partnerName}</p>
            <p className="truncate text-xs text-white/65">{presenceSubtitle}</p>
          </div>
          <div className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${partnerOnline ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/60"}`}>
            {partnerOnline ? "Online" : "Last seen"}
          </div>
        </button>
      </header>

      <section
        className="flex flex-1 flex-col overflow-hidden"
        onClick={() => {
          setSelectedMessageId(null);
          setShowEmojiPicker(false);
        }}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth">
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
              menuMessageId={menuMessageId}
              onReply={setReplyTo}
              onReact={handleReactMessage}
              onOpenMedia={setActiveMedia}
              onSelectMessage={handleSelectMessage}
              onOpenMenu={(item) => {
                setMenuMessageId((prev) => (prev === item.id ? null : item.id));
                setSelectedMessageId(null);
              }}
              onCopyMessage={handleCopyMenuMessage}
              onEditMessage={handleEditMenuMessage}
              onDeleteMessage={handleDeleteMenuMessage}
            />
          )}
          {typingNames.length > 0 ? (
            <div className="mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
              {typingNames.join(", ")} typing...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {isRecording ? (
          <div className="px-3 pb-2">
            <VoiceRecorder onRecorded={handleRecorded} onCancel={() => setIsRecording(false)} />
          </div>
        ) : null}

        {showEmojiPicker ? (
          <div className="mx-3 mb-2 rounded-2xl border border-white/10 bg-[#140f1f] px-3 py-2 text-lg text-white">
            {[
              "😀",
              "😅",
              "😂",
              "😍",
              "👍",
              "🙏",
            ].map((emoji) => (
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

        <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#120d20] px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3">
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

      {menuMessage ? (
        <button
          type="button"
          onClick={() => setMenuMessageId(null)}
          className="fixed inset-0 z-40 bg-black/30"
          aria-label="Close actions"
        />
      ) : null}

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