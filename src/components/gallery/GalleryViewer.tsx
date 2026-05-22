"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GalleryItem } from "@/lib/gallery/useGallery";

export default function GalleryViewer({
  item,
  onClose,
  onDelete,
  onDownload,
}: {
  item: GalleryItem | null;
  onClose: () => void;
  onDelete: (item: GalleryItem) => void;
  onDownload: (item: GalleryItem) => void;
}) {
  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-4 flex items-center justify-between px-4 text-white">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDownload(item)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="rounded-full border border-rose-300/40 bg-rose-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-rose-100"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="max-h-[85vh] w-[92vw] max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-black/60">
            {item.type === "video" && item.media_url ? (
              <video
                src={item.media_url}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            ) : item.media_url ? (
              <img
                src={item.media_url}
                alt={item.title ?? "Gallery"}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-[11px] uppercase tracking-[0.2em] text-white/60">
                Missing media
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
