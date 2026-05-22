"use client";

import { themes } from "@/lib/themes";
import { useTheme } from "@/components/ThemeProvider";

const optionClass =
  "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 transition hover:border-white/25 hover:bg-white/10";

export default function ThemeSelector() {
  const { mode, setMode } = useTheme();

  return (
    <div className="grid gap-3">
      <button
        type="button"
        className={`${optionClass} ${mode === "auto" ? "border-white/30 bg-white/10" : ""}`}
        onClick={() => setMode("auto")}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[10px] uppercase tracking-[0.25em] text-white/70">
          Auto
        </span>
        <span className="flex flex-col text-left">
          <span className="text-sm font-semibold">Auto day / night</span>
          <span className="text-[11px] text-white/60">
            Switches based on time and system preference
          </span>
        </span>
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`${optionClass} ${mode === theme.id ? "border-white/30 bg-white/10" : ""}`}
            onClick={() => setMode(theme.id)}
          >
            <span
              className="h-10 w-10 rounded-full"
              style={{ background: theme.preview }}
            />
            <span className="text-sm font-semibold">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
