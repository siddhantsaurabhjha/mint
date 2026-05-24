import { registerPlugin } from "@capacitor/core";

type FirebaseBootstrapResult = {
  initialized: boolean;
  available: boolean;
  error?: string;
};

type FirebaseBootstrapPlugin = {
  initialize: () => Promise<FirebaseBootstrapResult>;
};

const FirebaseBootstrap = registerPlugin<FirebaseBootstrapPlugin>("FirebaseBootstrap", {
  web: () => ({
    initialize: async () => ({
      initialized: false,
      available: false,
      error: "Firebase bootstrap is Android-only.",
    }),
  }),
});

export async function ensureFirebaseBootstrap() {
  try {
    const result = await FirebaseBootstrap.initialize();
    console.info("[firebase] bootstrap result", result);
    return result;
  } catch (error) {
    console.error("[firebase] bootstrap plugin failed", error);
    return {
      initialized: false,
      available: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies FirebaseBootstrapResult;
  }
}