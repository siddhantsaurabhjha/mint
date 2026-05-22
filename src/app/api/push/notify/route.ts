import { NextResponse } from "next/server";
import webpush from "web-push";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { title, body, url, tag, badge, senderId } = (await request.json()) as {
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
      badge?: number;
      senderId?: string | null;
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
      title: title ?? "Lumen Duo",
      body: body ?? "New update",
      url: url ?? "/",
      tag: tag ?? "lumen-duo",
      badge: badge ?? 1,
    });

    await Promise.all(
      data
        .filter((item) => (senderId ? item.user_id !== senderId : true))
        .map((item) =>
          webpush.sendNotification(
            {
              endpoint: item.endpoint,
              keys: { p256dh: item.p256dh, auth: item.auth },
            },
            payload
          )
        )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send notifications." }, { status: 500 });
  }
}
