import type { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-(--panel-solid) p-5 shadow-[0_18px_36px_rgba(0,0,0,0.4)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
