"use client";

import { useMemo, useRef, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import StoryStrip from "@/components/stories/StoryStrip";
import StoryViewer from "@/components/stories/StoryViewer";
import StoryComposer from "@/components/stories/StoryComposer";
import { useAuth } from "@/components/AuthProvider";
import { useStories } from "@/lib/stories/useStories";
import { getUploadSignature, uploadToCloudinary } from "@/lib/media/upload";
import { resolveUsernameFromEmail } from "@/lib/auth";

const STORY_FOLDER = "lumen-duo/stories";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;

export default function StoriesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const email = user?.email ?? null;
  const username = email ? resolveUsernameFromEmail(email) : null;
  const {
    stories,
    comments,
    views,
    isLoading,
    createStory,
    deleteStory,
    addComment,
    markSeen,
  } = useStories({ userId, username });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userMap = useMemo(() => {
    return stories.reduce((acc, item) => {
      acc[item.user_id] = item.username;
      return acc;
    }, {} as Record<string, string>);
  }, [stories]);

  const seenById = useMemo(() => {
    const seen = new Set(
      views.filter((view) => view.user_id === userId).map((view) => view.story_id)
    );
    return seen;
  }, [views, userId]);

  const stripItems = useMemo(() => {
    return stories.reduce(
      (acc, item) => {
        if (acc.some((entry) => entry.userId === item.user_id)) return acc;
        acc.push({
          id: item.id,
          userId: item.user_id,
          username: item.username,
          coverUrl: item.media_url,
          isSeen: stories
            .filter((story) => story.user_id === item.user_id)
            .every((story) => seenById.has(story.id)),
        });
        return acc;
      },
      [] as {
        id: string;
        userId: string;
        username: string;
        coverUrl: string | null;
        isSeen: boolean;
      }[]
    );
  }, [stories, seenById]);

  const handleFilePick = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("Max file size is 10MB.");
      return;
    }

    if (file.type.startsWith("video")) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_SECONDS) {
            setError("Video must be 1 minute or less.");
            URL.revokeObjectURL(url);
            resolve();
            return;
          }
          setPendingFile(file);
          setPreviewUrl(url);
          resolve();
        };
      });
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!pendingFile || !username || !userId) return;
    setIsSending(true);
    setUploadProgress(0);
    const isVideo = pendingFile.type.startsWith("video");
    try {
      const signature = await getUploadSignature(STORY_FOLDER, isVideo ? "video" : "image");
      const result = await uploadToCloudinary(signature, pendingFile, setUploadProgress);
      await createStory({
        type: isVideo ? "video" : "image",
        mediaUrl: result.url,
        caption: caption.trim() || null,
      });
      setPendingFile(null);
      setPreviewUrl(null);
      setCaption("");
    } finally {
      setUploadProgress(null);
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setCaption("");
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Stories"
        subtitle="Private moments, glowing for 24h."
        right={
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            Upload
          </button>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          Loading stories...
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          No stories yet. Upload a glowing moment.
        </div>
      ) : (
        <StoryStrip
          items={stripItems}
          onOpen={setActiveId}
          onCreate={() => fileInputRef.current?.click()}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setError(null);
          handleFilePick(file);
          event.target.value = "";
        }}
      />

      <StoryViewer
        stories={stories}
        activeId={activeId}
        onClose={() => setActiveId(null)}
        onSeen={markSeen}
        onComment={addComment}
        onDelete={deleteStory}
        currentUserId={userId}
        comments={comments}
        views={views}
        userMap={userMap}
      />

      <StoryComposer
        open={!!pendingFile}
        previewUrl={previewUrl}
        isVideo={pendingFile ? pendingFile.type.startsWith("video") : false}
        caption={caption}
        onCaptionChange={setCaption}
        onSend={handleUpload}
        onCancel={handleCancel}
        progress={uploadProgress}
        isSending={isSending}
      />
    </div>
  );
}
