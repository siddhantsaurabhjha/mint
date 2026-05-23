"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StoryStrip from "@/components/stories/StoryStrip";
import StoryViewer from "@/components/stories/StoryViewer";
import { useStories } from "@/lib/stories/useStories";
import { resolveUsernameFromEmail } from "@/lib/auth";

export default function StoriesRail({
  showEmptyState = false,
  showAdd = false,
  addLabel,
  onCreate,
  orderByUsernames,
}: {
  showEmptyState?: boolean;
  showAdd?: boolean;
  addLabel?: string;
  onCreate?: () => void;
  orderByUsernames?: string[];
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const email = user?.email ?? null;
  const username = email ? resolveUsernameFromEmail(email) : null;
  const {
    stories,
    reactions,
    comments,
    views,
    isLoading,
    deleteStory,
    addReaction,
    addComment,
    markSeen,
  } = useStories({ userId, username });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const userMap = useMemo(() => {
    return stories.reduce((acc, item) => {
      acc[item.user_id] = item.username;
      return acc;
    }, {} as Record<string, string>);
  }, [stories]);

  const seenById = useMemo(() => {
    return new Set(
      views.filter((view) => view.user_id === userId).map((view) => view.story_id)
    );
  }, [views, userId]);

  const stripItems = useMemo(() => {
    const base = stories.reduce(
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

    if (!orderByUsernames || orderByUsernames.length === 0) return base;
    const order = orderByUsernames.map((name) => name.toLowerCase());
    return [...base].sort((a, b) => {
      const aIndex = order.indexOf(a.username.toLowerCase());
      const bIndex = order.indexOf(b.username.toLowerCase());
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [stories, seenById, orderByUsernames]);

  const viewerStories = useMemo(() => {
    if (!activeUserId) return stories;
    return stories.filter((story) => story.user_id === activeUserId);
  }, [stories, activeUserId]);

  useEffect(() => {
    if (!activeId) return;
    if (viewerStories.some((story) => story.id === activeId)) return;
    setActiveId(viewerStories[0]?.id ?? null);
  }, [viewerStories, activeId]);

  const handleOpen = (storyId: string) => {
    const selected = stories.find((story) => story.id === storyId);
    setActiveId(storyId);
    setActiveUserId(selected?.user_id ?? null);
  };

  const handleClose = () => {
    setActiveId(null);
    setActiveUserId(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        Loading stories...
      </div>
    );
  }

  if (stripItems.length === 0 && showEmptyState && !showAdd) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        No stories yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stripItems.length > 0 || showAdd ? (
        <StoryStrip
          items={stripItems}
          onOpen={handleOpen}
          showAdd={showAdd}
          addLabel={addLabel}
          onCreate={onCreate}
        />
      ) : null}
      <StoryViewer
        stories={viewerStories}
        activeId={activeId}
        onClose={handleClose}
        onSeen={markSeen}
        onReact={addReaction}
        onComment={addComment}
        onDelete={deleteStory}
        currentUserId={userId}
        reactions={reactions}
        comments={comments}
        views={views}
        userMap={userMap}
      />
    </div>
  );
}
