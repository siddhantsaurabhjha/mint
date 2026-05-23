"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function CountdownCard({
  event,
  onMore,
}: {
  event: { id: string; title: string; target_date: string };
  onMore: (id: string) => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = useMemo(() => {
    const t = new Date(event.target_date).getTime();
    const diff = Math.max(0, t - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, isExpired: diff <= 0 };
  }, [event.target_date, now]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{event.title}</p>
            <p className="mt-1 text-[11px] text-white/60">{new Date(event.target_date).toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid grid-cols-4 gap-2 text-center text-white">
              {[parts.days, parts.hours, parts.minutes, parts.seconds].map((v, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/40 px-2 py-1">
                  <p className="text-sm font-semibold">{String(v).padStart(2, "0")}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">
                    {i === 0 ? "D" : i === 1 ? "H" : i === 2 ? "M" : "S"}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="More"
                className="rounded-full p-2 text-white/60"
                onClick={() => onMore(event.id)}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
