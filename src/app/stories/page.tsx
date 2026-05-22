"use client";

import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import StoryStrip from "@/components/stories/StoryStrip";
import StoryViewer from "@/components/stories/StoryViewer";
import { useStories } from "@/lib/stories/useStories";

export default function StoriesPage() {
  const { stories, isLoading } = useStories();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeStory = stories.find((story) => story.id === activeId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader title="Stories" subtitle="Private moments, glowing for 24h." />
      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          Loading stories...
        </div>
      ) : (
        <StoryStrip items={stories} onOpen={setActiveId} />
      )}
      <StoryViewer story={activeStory} onClose={() => setActiveId(null)} />
    </div>
  );
}
