"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function MediaViewer({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {src ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/90 backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 text-white">
            <p className="text-sm text-white/70">Media</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
            >
              Close
            </button>
          </div>
          <div className="max-h-[85vh] w-[92vw] max-w-xl overflow-hidden rounded-3xl border border-white/15">
            <img
              src={src}
              alt="Shared media"
              className="h-full w-full object-contain"
              style={{ touchAction: "pinch-zoom" }}
              loading="lazy"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
