import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { subscription, userId, fcmToken } = (await request.json()) as {
      subscription?: any;
      userId?: string | null;
      fcmToken?: string | null;
    };

    if (!subscription && !fcmToken) {
      return NextResponse.json(
        { error: "Missing subscription or FCM token." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const payload = fcmToken
      ? {
          endpoint: `fcm:${fcmToken}`,
          p256dh: null,
          auth: null,
          user_id: userId ?? null,
          updated_at: new Date().toISOString(),
        }
      : {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_id: userId ?? null,
          updated_at: new Date().toISOString(),
        };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(payload, {
        onConflict: "endpoint",
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save subscription." },
      { status: 500 }
    );
  }
}