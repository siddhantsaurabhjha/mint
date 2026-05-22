"use client";

import { useEffect, useRef, useState } from "react";
import { getAudioDuration } from "@/lib/media/audio";

export default function VoiceRecorder({
  onRecorded,
  onCancel,
}: {
  onRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const duration = await getAudioDuration(blob);
      onRecorded(blob, duration);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setSeconds(0);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <button
        type="button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white"
      >
        Hold
      </button>
      <div className="flex-1">
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-white/50" />
        </div>
        <p className="mt-1 text-[11px] text-white/60">
          {isRecording ? `Recording ${seconds}s` : "Hold to record"}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] uppercase tracking-[0.2em] text-white/60"
      >
        Cancel
      </button>
    </div>
  );
}
