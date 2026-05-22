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
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 backdrop-blur-2xl">
      <div className="w-[92vw] max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/70">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
          <p className="text-sm text-white/70">Preview</p>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            Close
          </button>
        </div>
        <img src={src} alt="Preview" className="w-full object-cover" />
        <div className="space-y-3 px-4 py-4">
          {progress !== null ? <UploadProgress value={progress} /> : null}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSend}
              className="rounded-full border border-emerald-300/50 bg-emerald-300/20 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-emerald-100 transition active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
