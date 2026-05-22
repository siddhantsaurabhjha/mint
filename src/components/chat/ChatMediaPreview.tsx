"use client";

import UploadProgress from "@/components/media/UploadProgress";

export default function ChatMediaPreview({
  src,
  onCancel,
  onSend,
  progress,
}: {
  src: string | null;
  onCancel: () => void;
  onSend: () => void;
  progress: number | null;
}) {
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-2xl">
      <div className="w-[90vw] max-w-md rounded-3xl border border-white/10 bg-white/5 p-4">
        <img src={src} alt="Preview" className="w-full rounded-2xl object-cover" />
        {progress !== null ? <UploadProgress value={progress} /> : null}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
