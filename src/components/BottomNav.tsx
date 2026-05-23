"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { Home, Images, NotebookPen, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-(--bg-2) shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex w-full max-w-md items-center px-5 pb-[env(safe-area-inset-bottom)] pt-2">
        <LayoutGroup>
          <div className="relative flex h-(--bottom-nav-height) w-full items-center justify-between">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="relative flex flex-1 items-center justify-center"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="mint-nav-pill"
                      className="absolute inset-x-4 -top-1 h-11 rounded-2xl bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                      isActive
                        ? "text-white"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.7} />
                  </span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
}
