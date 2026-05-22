"use client";

import UploadProgress from "@/components/media/UploadProgress";

export default function StoryComposer({
  open,
  previewUrl,
  isVideo,
  caption,
  onCaptionChange,
  onSend,
  onCancel,
  progress,
  isSending,
}: {
  open: boolean;
  previewUrl: string | null;
  isVideo: boolean;
  caption: string;
  onCaptionChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  progress: number | null;
  isSending: boolean;
}) {
  if (!open || !previewUrl) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-2xl">
      <div className="w-[92vw] max-w-md rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {isVideo ? (
            <video
              src={previewUrl}
              className="h-[60vh] w-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={previewUrl}
              alt="Story preview"
              className="h-[60vh] w-full object-cover"
            />
          )}
        </div>
        <textarea
          value={caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          placeholder="Add a caption"
          className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
          rows={2}
        />
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
            disabled={isSending}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
