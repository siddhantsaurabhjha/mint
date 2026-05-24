"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(180,120,255,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,90,160,0.2),transparent_60%),#070910]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(178,80,255,0.35)]">
              <div className="h-6 w-6 rounded-full bg-[conic-gradient(from_140deg,#b347ff,#ff5fa2,#4b7bff,#b347ff)]" />
            </div>
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                LASI
              </p>
              <p className="text-lg font-semibold text-white">Private, by design</p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
