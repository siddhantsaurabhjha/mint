import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import NativeBridge from "@/components/NativeBridge";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LASI",
    template: "%s | LASI",
  },
  description: "Private couple space with neon romance and offline-ready moments.",
  applicationName: "LASI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "LASI",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="midnight-blue"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-text">
        <ThemeProvider>
          <AuthProvider>
            <NativeBridge />
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
