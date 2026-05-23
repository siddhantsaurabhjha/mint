"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { formatDuration } from "@/lib/media/format";

const speeds = [1, 1.5, 2];
const WAVEFORM_SAMPLES = 36;

export default function ChatVoiceBubble({
  message,
  timeLabel,
  statusLabel,
  statusTone,
  statusIcon,
  isOwn,
}: {
  message: ChatMessage;
  timeLabel?: string;
  statusLabel?: string | null;
  statusTone?: string;
  statusIcon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null;
  isOwn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const duration = useMemo(() => {
    const meta = message.media_meta as Record<string, unknown> | null | undefined;
    const value = meta && typeof meta.duration === "number" ? meta.duration : 0;
    return value;
  }, [message.media_meta]);
  const waveform = useMemo(() => {
    const meta = message.media_meta as Record<string, unknown> | null | undefined;
    const values = meta && Array.isArray(meta.waveform) ? meta.waveform : [];
    const normalized = values
      .filter((value) => typeof value === "number")
      .map((value) => Math.min(1, Math.max(0.1, value as number)));
    if (normalized.length >= WAVEFORM_SAMPLES) {
      return normalized.slice(0, WAVEFORM_SAMPLES);
    }
    if (normalized.length > 0) {
      const fill = new Array(WAVEFORM_SAMPLES - normalized.length).fill(
        normalized[normalized.length - 1]
      );
      return normalized.concat(fill);
    }
    return new Array(WAVEFORM_SAMPLES).fill(0.2);
  }, [message.media_meta]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnd = () => setIsPlaying(false);
    const handleTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration || 0);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
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

  const effectiveDuration = duration || audioDuration || 0;
  const progress = effectiveDuration
    ? Math.min(1, currentTime / effectiveDuration)
    : 0;

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
        <div className="flex h-8 items-end gap-1">
          {waveform.map((value, index) => {
            const height = Math.max(6, Math.round(value * 26));
            const threshold = (index + 1) / waveform.length;
            const isActive = threshold <= progress;
            return (
              <span
                key={`wave-${index}`}
                className={`w-1 rounded-full transition-all ${
                  isActive ? "bg-white" : "bg-white/35"
                }`}
                style={{ height }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
          <span>
            Voice note • {effectiveDuration ? formatDuration(effectiveDuration) : "--:--"}
          </span>
          <div className="flex items-center gap-2">
            {timeLabel ? <span>{timeLabel}</span> : null}
            {isOwn && statusIcon ? (() => {
              const StatusIcon = statusIcon;
              return <StatusIcon size={12} strokeWidth={2.4} className={statusTone ?? "text-white/70"} />;
            })() : isOwn && statusLabel ? (
              <span className={statusTone ?? "text-white/70"}>{statusLabel}</span>
            ) : null}
          </div>
        </div>
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
