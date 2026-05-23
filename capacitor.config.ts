import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lasi.app",
  appName: "LASI",
  webDir: "out",
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