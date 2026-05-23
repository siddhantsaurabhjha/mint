"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import PwaManager from "@/components/PwaManager";
import SplashScreen from "@/components/SplashScreen";

const pageTransition = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isChat = pathname === "/chat";

  return (
    <div className="relative min-h-dvh overflow-x-hidden app-ambient">
      <SplashScreen />
      <AuthGate />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageTransition}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className={`relative z-10 mx-auto w-full max-w-md overflow-x-hidden px-4 pt-[calc(24px+env(safe-area-inset-top))] ${
            isLogin
              ? "pb-[calc(24px+env(safe-area-inset-bottom))]"
              : isChat
              ? "pb-[calc(16px+env(safe-area-inset-bottom))]"
              : "pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+20px)]"
          }`}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <PwaManager />
      {isLogin || isChat ? null : <BottomNav />}
    </div>
  );
}
