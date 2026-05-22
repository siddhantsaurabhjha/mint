declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PwaOptions = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: unknown;
  };

  export default function withPWA(
    options?: PwaOptions
  ): (config: NextConfig) => NextConfig;
}

declare module "next-pwa/cache" {
  const runtimeCaching: unknown;
  export default runtimeCaching;
}
