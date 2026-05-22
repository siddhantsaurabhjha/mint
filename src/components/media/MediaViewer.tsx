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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white"
          >
            Close
          </button>
          <div className="max-h-[85vh] w-[90vw] max-w-md overflow-hidden rounded-3xl border border-white/15">
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
