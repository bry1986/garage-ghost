"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Content shell for the app.
 *
 * The landing page's cinematic hero is edge-to-edge (full-bleed image), so
 * `main` drops its max-width/padding there. Every other page keeps the
 * standard constrained container. The landing page provides its own inner
 * container for the sections below the hero.
 */
export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <main
      id="main-content"
      className={
        isLanding
          ? "w-full flex-1 scroll-mt-0"
          : "mx-auto w-full max-w-6xl flex-1 scroll-mt-20 px-4 pb-24 pt-6 sm:px-6 sm:pt-10"
      }
    >
      {children}
    </main>
  );
}
