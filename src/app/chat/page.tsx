"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
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
  } = useChatRoom({ userId, email });

  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
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
    await sendMessage({
      body: trimmed,
      replyTo: replyTo?.id ?? null,
    });
    setMessage("");
    setReplyTo(null);
    setIsSending(false);
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

  const handleRecorded = async (blob: Blob, duration: number) => {
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
        mediaMeta: { duration },
      });
      setReplyTo(null);
    } finally {
      setIsRecording(false);
      setUploadProgress(null);
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <ScreenHeader
        title="Chat"
        subtitle={presenceSubtitle}
        right={
          <div
            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] ${
              partnerOnline
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/15 bg-white/5 text-white/60"
            }`}
          >
            {partnerOnline ? "Online" : "Offline"}
          </div>
        }
      />

      <section className="flex flex-1 flex-col gap-4">
        <div className="flex-1 space-y-4">
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
              onReply={setReplyTo}
              onReact={(item) => sendReaction({ messageId: item.id, value: "<3" })}
              onDelete={(item) => deleteMessage(item.id)}
              onOpenMedia={setActiveMedia}
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

        <div className="sticky bottom-[calc(92px+env(safe-area-inset-bottom))]">
          <ChatInputBar
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onTyping={notifyTyping}
            onPickImage={() => fileInputRef.current?.click()}
            onToggleRecorder={() => setIsRecording((prev) => !prev)}
            isRecording={isRecording}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
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