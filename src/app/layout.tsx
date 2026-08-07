import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Header } from "@/components/header";
import { APP_NAME, APP_TAGLINE, PUTER_DEVELOPER_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description:
    "Safety-first educational AI triage for vehicle warning lights and symptoms. Understand the warning. Choose the safe next step.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-8">{children}</main>
        <footer className="border-t border-zinc-800">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {APP_NAME}. Educational guidance only — not a diagnosis.
            </p>
            <a
              href={PUTER_DEVELOPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 transition-colors hover:text-zinc-300 hover:underline"
            >
              Powered by Puter
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
