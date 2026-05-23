"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useAuth } from "@/components/AuthProvider";
import { saveNativePushToken } from "@/lib/pwa/push";

const PUSH_PERMISSION_KEY = "lasi:native-push-permission-requested";
const LOCAL_PERMISSION_KEY = "lasi:native-local-permission-requested";

function hasRequestedPermission(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function markRequestedPermission(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Ignore storage failures in restricted WebViews.
  }
}

async function registerNativePush(userId: string | null) {
  if (!Capacitor.isNativePlatform()) return;
  if (!userId) return;

  const pushPermissions = await PushNotifications.checkPermissions();
  if (pushPermissions.receive !== "granted" && !hasRequestedPermission(PUSH_PERMISSION_KEY)) {
    markRequestedPermission(PUSH_PERMISSION_KEY);
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== "granted") return;
  } else if (pushPermissions.receive !== "granted") {
    return;
  }

  const localPermissions = await LocalNotifications.checkPermissions();
  if (localPermissions.display !== "granted" && !hasRequestedPermission(LOCAL_PERMISSION_KEY)) {
    markRequestedPermission(LOCAL_PERMISSION_KEY);
    await LocalNotifications.requestPermissions();
  }

  try {
    await LocalNotifications.createChannel({
      id: "lasi-chat",
      name: "LASI Messages",
      description: "Chat message notifications",
      importance: 5,
      visibility: 1,
    });
  } catch {
    // The channel may already exist or the platform may ignore this call.
  }

  const registrationListener = await PushNotifications.addListener(
    "registration",
    async (token: Token) => {
      await saveNativePushToken(userId, token.value);
    }
  );

  const registrationErrorListener = await PushNotifications.addListener(
    "registrationError",
    (error) => {
      console.error("[push] registration error", error);
    }
  );

  const receivedListener = await PushNotifications.addListener(
    "pushNotificationReceived",
    async (notification: PushNotificationSchema) => {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 2147483647,
              title: notification.title ?? "LASI",
              body: notification.body ?? "New message",
              channelId: "lasi-chat",
              extra: notification.data ?? {},
              schedule: { at: new Date(Date.now() + 100) },
            },
          ],
        });
      } catch (error) {
        console.error("[push] local notification error", error);
      }
    }
  );

  const actionListener = await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const target = typeof action.notification.data?.url === "string" ? action.notification.data.url : "/chat";
      window.location.assign(target);
    }
  );

  await PushNotifications.register();

  return async () => {
    await registrationListener.remove();
    await registrationErrorListener.remove();
    await receivedListener.remove();
    await actionListener.remove();
  };
}

export default function NativeBridge() {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let cleanup: (() => Promise<void>) | undefined;

    void (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        await SplashScreen.hide({ fadeOutDuration: 220 });
      } catch {
        // Ignore status bar/splash errors in restricted environments.
      }

      cleanup = await registerNativePush(user?.id ?? null);
    })();

    return () => {
      void cleanup?.();
    };
  }, [user?.id]);

  return null;
}