"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/stories", label: "Stories", icon: "stories" },
  { href: "/chat", label: "Chat", icon: "chat", badge: "2" },
  { href: "/gallery", label: "Gallery", icon: "gallery" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const icons: Record<string, ReactNode> = {
  home: (
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
  ),
  stories: (
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5A8.5 8.5 0 0 0 12 3.5Zm0 3a5.5 5.5 0 1 1-5.5 5.5A5.5 5.5 0 0 1 12 6.5Zm0 2.5a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
  ),
  chat: (
    <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H9l-4 3.5V16A3.5 3.5 0 0 1 5 12.5v-6Z" />
  ),
  gallery: (
    <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5Zm4 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 8 3.5-4.5 2.5 3 3.5-4.5 3.5 6H7Z" />
  ),
  profile: (
    <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0" />
  ),
};

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                isActive
                  ? "text-white"
                  : "text-white/55 hover:text-white/80"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                  isActive
                    ? "bg-white/15 shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                    : "bg-transparent"
                }`}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icons[item.icon]}
                </svg>
                {item.badge ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
