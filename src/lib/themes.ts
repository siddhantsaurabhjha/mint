export const themes = [
  {
    id: "neon-purple",
    label: "Neon Purple",
    preview: "linear-gradient(135deg, #b347ff 0%, #5b2cff 100%)",
  },
  {
    id: "romantic-red",
    label: "Romantic Red",
    preview: "linear-gradient(135deg, #ff4d6d 0%, #b91c48 100%)",
  },
  {
    id: "midnight-blue",
    label: "Midnight Blue",
    preview: "linear-gradient(135deg, #4b7bff 0%, #1e2b88 100%)",
  },
  {
    id: "soft-pink",
    label: "Soft Pink",
    preview: "linear-gradient(135deg, #ff9ad1 0%, #ff5fa2 100%)",
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export type ThemeMode = ThemeId | "auto";
