import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MainShell } from "@/components/main-shell";
import { ProProvider } from "@/components/pro-provider";
import { PwaRegister } from "@/components/pwa-register";
import { RoutePrefetcher } from "@/components/route-prefetcher";
import { SplashOverlay } from "@/components/splash-overlay";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description:
    "Safety-first educational AI triage for vehicle warning lights and symptoms. Understand the warning. Choose the safe next step.",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/apple-touch-icon.png",
    // iOS launch splash screens (apple-touch-startup-image), matched per device
    // by CSS media query. Generated to match each device's portrait screen.
    other: [
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-SE-640x1136.png",
        media: "(device-width: 320px) and (device-height: 568px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-8-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-8Plus-1242x2208.png",
        media: "(device-width: 414px) and (device-height: 736px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-X-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-XR-828x1792.png",
        media: "(device-width: 414px) and (device-height: 896px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-XSMax-1242x2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-12-1170x2532.png",
        media: "(device-width: 390px) and (device-height: 844px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-12ProMax-1284x2778.png",
        media: "(device-width: 428px) and (device-height: 926px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-14Pro-1179x2556.png",
        media: "(device-width: 393px) and (device-height: 852px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPhone-14ProMax-1290x2796.png",
        media: "(device-width: 430px) and (device-height: 932px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPad-768x1024-1536x2048.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPad-Air-1668x2224.png",
        media: "(device-width: 834px) and (device-height: 1112px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPad-Pro11-1668x2388.png",
        media: "(device-width: 834px) and (device-height: 1194px)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/icons/splash/iPad-Pro129-2048x2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px)",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <SplashOverlay />
        <PwaRegister />
        <RoutePrefetcher />
        <ProProvider>
          {/* Skip link: kept off-screen (translated + hidden) until focused, so
              it never conflicts with sticky header positioning or the sr-only
              clip (which would fight focus:absolute at the same specificity). */}
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-50 -translate-y-24 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 opacity-0 shadow-lg transition-all duration-200 focus:translate-y-0 focus:opacity-100"
          >
            Skip to main content
          </a>
          <Header />
          <MainShell>{children}</MainShell>
          <Footer />
        </ProProvider>
      </body>
    </html>
  );
}
