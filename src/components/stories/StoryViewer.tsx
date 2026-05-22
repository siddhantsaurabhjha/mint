"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  StoryComment,
  StoryItem,
  StoryReaction,
  StoryView,
} from "@/lib/stories/useStories";

const IMAGE_DURATION_MS = 6000;

export default function StoryViewer({
  stories,
  activeId,
  onClose,
  onSeen,
  onReact,
  onComment,
  onDelete,
  currentUserId,
  reactions,
  comments,
  views,
  userMap,
}: {
  stories: StoryItem[];
  activeId: string | null;
  onClose: () => void;
  onSeen: (storyId: string) => void;
  onReact: (storyId: string, reaction: string) => void;
  onComment: (storyId: string, body: string) => void;
  onDelete: (story: StoryItem) => void;
  currentUserId: string | null;
  reactions: StoryReaction[];
  comments: StoryComment[];
  views: StoryView[];
  userMap: Record<string, string>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const story = stories[activeIndex] ?? null;
  const isOpen = Boolean(activeId && story);

  const activeStoryId = story?.id ?? null;
  const storyComments = useMemo(
    () => comments.filter((item) => item.story_id === activeStoryId),
    [comments, activeStoryId]
  );
  const storyReactions = useMemo(
    () => reactions.filter((item) => item.story_id === activeStoryId),
    [reactions, activeStoryId]
  );
  const storyViews = useMemo(
    () => views.filter((item) => item.story_id === activeStoryId),
    [views, activeStoryId]
  );

  useEffect(() => {
    if (!activeId) return;
    const nextIndex = stories.findIndex((item) => item.id === activeId);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [activeId, stories]);

  useEffect(() => {
    if (!story || !activeId) return;
    onSeen(story.id);
    setProgress(0);
  }, [story, activeId, onSeen]);

  useEffect(() => {
    if (!story || !activeId || story.type === "video") return;
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / IMAGE_DURATION_MS);
      setProgress(next);
      if (next >= 1) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [story, activeId]);

  const goNext = () => {
    if (activeIndex + 1 >= stories.length) {
      onClose();
      return;
    }
    setProgress(0);
    setActiveIndex((prev) => Math.min(stories.length - 1, prev + 1));
  };

  const goPrev = () => {
    if (activeIndex === 0) return;
    setProgress(0);
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleVideoTime = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress(video.currentTime / video.duration);
  };

  const handleCommentSubmit = () => {
    if (!story || !commentText.trim()) return;
    const prefix = replyTarget ? `@${replyTarget} ` : "";
    onComment(story.id, `${prefix}${commentText.trim()}`);
    setCommentText("");
    setReplyTarget(null);
  };

  const quickReactions = ["<3", "shine", "fire", "wow", "kiss"];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black"
        >
          <div className="px-4 pt-4">
            <div className="flex gap-1">
              {stories.map((item, index) => {
                const isPast = index < activeIndex;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={item.id}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                  >
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{
                        width: `${
                          isPast ? 100 : isActive ? Math.round(progress * 100) : 0
                        }%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{story.username}</p>
              <p className="text-[11px] text-white/60">
                {storyViews.length} seen
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-white/60">
              {story.user_id === currentUserId ? (
                <button type="button" onClick={() => onDelete(story)}>
                  Delete
                </button>
              ) : null}
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/5"
            />
            {story.type === "video" && story.media_url ? (
              <video
                ref={videoRef}
                src={story.media_url}
                className="max-h-[80vh] w-[90vw] max-w-md rounded-3xl object-cover"
                onTimeUpdate={handleVideoTime}
                onEnded={goNext}
                autoPlay
                muted
                playsInline
              />
            ) : story.media_url ? (
              <img
                src={story.media_url}
                alt="Story"
                className="max-h-[80vh] w-[90vw] max-w-md rounded-3xl object-cover"
              />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-white/70">
                {story.caption ?? "Story"}
              </div>
            )}
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/5"
            />
          </div>

          <div className="space-y-3 px-4 pb-4 text-white">
            {story.caption ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                {story.caption}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              {quickReactions.map((reaction) => (
                <button
                  key={reaction}
                  type="button"
                  onClick={() => onReact(story.id, reaction)}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs"
                >
                  {reaction}
                </button>
              ))}
              <div className="ml-auto text-[11px] text-white/60">
                {storyReactions.length} reactions
              </div>
            </div>

            <div className="max-h-24 space-y-2 overflow-y-auto">
              {storyComments.map((comment) => {
                const displayName =
                  userMap[comment.user_id] ??
                  (comment.user_id === currentUserId ? "You" : "Partner");
                return (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/60">
                      <span>{displayName}</span>
                      <button
                        type="button"
                        onClick={() => setReplyTarget(displayName)}
                        className="text-white/60"
                      >
                        Reply
                      </button>
                    </div>
                    <p className="mt-1 text-white/80">{comment.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={replyTarget ? `Reply to ${replyTarget}` : "Send a reply"}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={handleCommentSubmit}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
