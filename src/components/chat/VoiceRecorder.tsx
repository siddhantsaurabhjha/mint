"use client";

import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { getAudioDuration } from "@/lib/media/audio";

const MAX_SECONDS = 120;
const CANCEL_DISTANCE = 80;
const WAVEFORM_SAMPLES = 36;

export default function VoiceRecorder({
  onRecorded,
  onCancel,
}: {
  onRecorded: (blob: Blob, duration: number, waveform: number[]) => void;
  onCancel: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isCancelArmed, setIsCancelArmed] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    if (seconds >= MAX_SECONDS) {
      stopRecording(false);
    }
  }, [seconds, isRecording]);

  const stopWaveform = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const teardownStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    setWaveform([]);
    setIsCancelArmed(false);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (cancelledRef.current) {
        cancelledRef.current = false;
        teardownStream();
        stopWaveform();
        return;
      }
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const duration = await getAudioDuration(blob);
      const compactWaveform = waveform.length
        ? waveform.slice(-WAVEFORM_SAMPLES)
        : new Array(WAVEFORM_SAMPLES).fill(0.2);
      onRecorded(blob, duration, compactWaveform);
      teardownStream();
      stopWaveform();
    };

    recorder.start();
    setSeconds(0);
    setIsRecording(true);

    const samples = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const value = (samples[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.min(1, Math.sqrt(sum / samples.length));
      setWaveform((prev) => {
        const next = [...prev, rms];
        return next.slice(-WAVEFORM_SAMPLES);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRecording = (cancelled: boolean) => {
    if (!mediaRecorderRef.current) return;
    cancelledRef.current = cancelled;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsCancelArmed(false);
    if (cancelled) {
      chunksRef.current = [];
      onCancel();
    }
  };

  const handlePointerDown = async (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startXRef.current = event.clientX;
    await startRecording();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isRecording || startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    setIsCancelArmed(delta < -CANCEL_DISTANCE);
  };

  const handlePointerUp = () => {
    if (!isRecording) return;
    stopRecording(isCancelArmed);
    startXRef.current = null;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white transition ${
            isCancelArmed
              ? "border-rose-300/60 bg-rose-400/20"
              : "border-white/20 bg-white/10"
          }`}
          style={{ touchAction: "none" }}
        >
          Hold
        </button>
        <div className="flex-1">
          <div className="flex h-8 items-end gap-1">
            {Array.from({ length: WAVEFORM_SAMPLES }).map((_, index) => {
              const value = waveform[index] ?? 0.2;
              const height = Math.max(6, Math.round(value * 26));
              return (
                <span
                  key={`wave-${index}`}
                  className={`w-1 rounded-full transition-all ${
                    isCancelArmed ? "bg-rose-300/70" : "bg-white/40"
                  }`}
                  style={{ height }}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-white/60">
            {isRecording
              ? isCancelArmed
                ? "Release to cancel"
                : `Recording ${seconds}s • slide left to cancel`
              : "Hold to record"}
          </p>
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">
          {Math.min(seconds, MAX_SECONDS)}s
        </div>
      </div>
    </div>
  );
}
