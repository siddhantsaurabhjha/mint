"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeId, ThemeMode } from "@/lib/themes";

const STORAGE_KEY = "lumen-theme-mode";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ThemeId;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeId = (value: string): value is ThemeId =>
  value === "neon-purple" ||
  value === "romantic-red" ||
  value === "midnight-blue" ||
  value === "soft-pink";

const getAutoTheme = (): ThemeId => {
  const hour = new Date().getHours();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isNight = hour >= 19 || hour < 6;

  if (prefersDark || isNight) {
    return "midnight-blue";
  }

  return "soft-pink";
};

const applyTheme = (theme: ThemeId) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = "dark";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<ThemeId>("midnight-blue");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "auto" || (saved && isThemeId(saved))) {
      setMode(saved as ThemeMode);
    }
  }, []);

  useEffect(() => {
    const updateAutoTheme = () => {
      const nextTheme = getAutoTheme();
      setResolvedTheme(nextTheme);
      applyTheme(nextTheme);
    };

    if (mode === "auto") {
      updateAutoTheme();
      const interval = window.setInterval(updateAutoTheme, 5 * 60 * 1000);
      window.addEventListener("visibilitychange", updateAutoTheme);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("visibilitychange", updateAutoTheme);
      };
    }

    setResolvedTheme(mode);
    applyTheme(mode);
    return undefined;
  }, [mode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
