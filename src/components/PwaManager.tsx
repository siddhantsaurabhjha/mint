"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/components/AuthProvider";
import { clearAppBadge, ensurePushSubscription } from "@/lib/pwa/push";

const NOTIFICATION_PERMISSION_KEY = "lasi:notification-permission";

const readStoredPermission = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  } catch {
    return null;
  }
};

const writeStoredPermission = (value: "granted" | "denied") => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, value);
  } catch {
    // Ignore storage errors in private mode or restricted environments.
  }
};

export default function PwaManager() {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showInstall, setShowInstall] = useState(false);
  const [showNotify, setShowNotify] = useState(false);

  useEffect(() => {
    if (isNative) return;
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isNative]);

  useEffect(() => {
    if (isNative) return;
    if (!user) return;
    const permission = Notification.permission;
    const storedPermission = readStoredPermission();
    if (permission === "granted") {
      writeStoredPermission("granted");
      setShowNotify(false);
    } else if (permission === "denied") {
      writeStoredPermission("denied");
      setShowNotify(false);
    } else {
      setShowNotify(storedPermission !== "granted");
    }
    clearAppBadge();
  }, [isNative, user]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setShowInstall(false);
  };

  const handleEnableNotifications = async () => {
    if (isNative) return;
    await ensurePushSubscription(user?.id ?? null);
    if (Notification.permission === "granted") {
      writeStoredPermission("granted");
      setShowNotify(false);
      return;
    }
    if (Notification.permission === "denied") {
      writeStoredPermission("denied");
      setShowNotify(false);
      return;
    }
    setShowNotify(true);
  };

  if (!showInstall && !showNotify) return null;
  if (isNative) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+12px)] z-60 px-4">
      <div className="mx-auto flex max-w-md flex-col gap-2 rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-2xl">
        {showInstall ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Install LASI</span>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Install
            </button>
          </div>
        ) : null}
        {showNotify ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Enable notifications</span>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            >
              Allow
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
