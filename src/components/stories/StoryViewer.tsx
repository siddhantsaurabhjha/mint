"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { StoryItem } from "@/lib/stories/useStories";

export default function StoryViewer({
  story,
  onClose,
}: {
  story: StoryItem | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {story ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black"
        >
          <div className="h-1 w-full bg-white/20">
            <div className="h-full w-1/2 bg-white" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{story.username}</p>
              <p className="text-[11px] text-white/60">Story</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] uppercase tracking-[0.2em] text-white/60"
            >
              Close
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {story.media_url ? (
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
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
