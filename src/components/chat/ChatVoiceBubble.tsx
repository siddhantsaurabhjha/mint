"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { formatDuration } from "@/lib/media/format";

const speeds = [1, 1.5, 2];

export default function ChatVoiceBubble({ message }: { message: ChatMessage }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const duration = useMemo(() => {
    const meta = message.media_meta as Record<string, unknown> | null | undefined;
    const value = meta && typeof meta.duration === "number" ? meta.duration : 0;
    return value;
  }, [message.media_meta]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnd = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnd);

    return () => audio.removeEventListener("ended", handleEnd);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % speeds.length;
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = speeds[nextIndex];
    }
    setSpeedIndex(nextIndex);
  };

  if (!message.media_url) return null;

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={message.media_url} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <div className="flex-1">
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-white/40" />
        </div>
        <p className="mt-1 text-[11px] text-white/50">
          Voice note • {duration ? formatDuration(duration) : "--:--"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggleSpeed}
        className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/70"
      >
        {speeds[speedIndex]}x
      </button>
    </div>
  );
}
