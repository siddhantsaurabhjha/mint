"use client";

import type { StoryItem } from "@/lib/stories/useStories";

export default function StoryStrip({
  items,
  onOpen,
}: {
  items: StoryItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item.id)}
          className="flex min-w-[82px] flex-col items-center gap-2"
        >
          <div className="h-16 w-16 rounded-3xl border border-white/20 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            {item.username}
          </span>
        </button>
      ))}
    </div>
  );
}
