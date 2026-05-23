import { NextResponse } from "next/server";
import webpush from "web-push";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    const results = await Promise.allSettled(
      targetSubscriptions.map((item) =>
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
          staleEndpoints.push(targetSubscriptions[index].endpoint);
        }
      }
    });

    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send notifications." }, { status: 500 });
  }
}
