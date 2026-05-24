import { Capacitor } from "@capacitor/core";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  badge?: number;
  senderId?: string | null;
  recipientId?: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensurePushSubscription(userId: string | null) {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") return null;
    if (Capacitor.isNativePlatform()) return null;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      return null;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return null;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.warn("[push] VAPID public key missing");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: existing, userId }),
      });
      return existing;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, userId }),
    });

    return subscription;
  } catch (error) {
    console.error("[push] web subscription failed", error);
    return null;
  }
}

export async function sendPushNotification(payload: PushPayload) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[push] notify request failed", error);
  }
}

export async function saveNativePushToken(userId: string | null, fcmToken: string) {
  if (typeof window === "undefined" || !fcmToken) return;

  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fcmToken }),
    });
  } catch (error) {
    console.error("[push] native token save failed", error);
  }
}

export function clearAppBadge() {
  if (typeof window === "undefined") return;

  try {
    if ("clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch(() => null);
    }
  } catch (error) {
    console.warn("[push] clear app badge failed", error);
  }
}
