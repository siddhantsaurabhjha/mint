import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.mint.app",
  appName: "MINT",
  webDir: "public",
  bundledWebRuntime: false,
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : undefined,
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#080c1a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#080c1a",
    },
  },
};

export default config;