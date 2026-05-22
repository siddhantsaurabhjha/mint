"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = ["/login"];

export default function AuthGate() {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.replace("/login");
    }
  }, [status, isPublic, router]);

  const showOverlay = status === "loading" && !isPublic;

  return (
    <AnimatePresence>
      {showOverlay ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(120,80,255,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,90,160,0.2),_transparent_60%),rgba(8,10,18,0.92)]"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="h-12 w-12 rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(178,80,255,0.25)]" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                Securing Session
              </p>
              <p className="text-base font-semibold text-white">
                Verifying your private space
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
