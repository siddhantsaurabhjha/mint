import { NextResponse } from "next/server";
import webpush from "web-push";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFirebaseAdminMessaging() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (serviceAccountJson) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccountJson)),
      });
    } else if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
  }

  return getApps().length ? getMessaging() : null;
}

export async function POST(request: Request) {
  try {
    const { title, body, url, tag, badge, senderId, recipientId } = (await request.json()) as {
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
      badge?: number;
      senderId?: string | null;
      recipientId?: string | null;
    };

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:hello@lumenduo.local";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "Missing VAPID keys." }, { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id");

    if (error || !data) {
      return NextResponse.json({ error: "Missing subscriptions." }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: title ?? "MINT",
      body: body ?? "New message",
      url: url ?? "/",
      tag: tag ?? "mint-chat-message",
      badge: badge ?? 1,
    });

    const targetSubscriptions = data.filter((item) => {
      if (recipientId) return item.user_id === recipientId;
      if (senderId) return item.user_id !== senderId;
      return true;
    });

    const webSubscriptions = targetSubscriptions.filter(
      (item) => item.endpoint && !item.endpoint.startsWith("fcm:") && item.p256dh && item.auth
    );
    const fcmTokens = targetSubscriptions
      .filter((item) => item.endpoint?.startsWith("fcm:"))
      .map((item) => item.endpoint.replace(/^fcm:/, ""))
      .filter(Boolean);

    const results = await Promise.allSettled(
      webSubscriptions.map((item) =>
          webpush.sendNotification(
            {
              endpoint: item.endpoint,
              keys: { p256dh: item.p256dh, auth: item.auth },
            },
            payload
          )
        )
    );

    const staleEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const reason = result.reason as { statusCode?: number } | undefined;
        if (reason?.statusCode === 404 || reason?.statusCode === 410) {
          staleEndpoints.push(webSubscriptions[index].endpoint);
        }
      }
    });

    const messaging = getFirebaseAdminMessaging();
    if (fcmTokens.length > 0 && !messaging) {
      return NextResponse.json({ error: "Missing Firebase Admin configuration." }, { status: 500 });
    }

    if (messaging && fcmTokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title: title ?? "MINT",
          body: body ?? "New message",
        },
        data: {
          url: url ?? "/chat",
          tag: tag ?? "mint-chat-message",
          badge: String(badge ?? 1),
        },
        android: {
          priority: "high",
        },
      });
    }

    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send notifications." }, { status: 500 });
  }
}
