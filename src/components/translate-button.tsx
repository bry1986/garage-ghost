"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => void;
        InlineLayout: { SIMPLE: number };
      };
    };
  }
}

/** Google Website Translator endpoint. `cb` is invoked once the API is ready. */
const TRANSLATE_SCRIPT_SRC =
  "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

/**
 * Languages offered by the on-site translator. English is included so
 * visitors can switch back; the site is authored in English.
 */
const TRANSLATE_LANGUAGES = "en,fr,ar,es,de";

/**
 * Module-level cache so dev remounts (StrictMode) never double-inject the
 * Google script. The widget element id is a global singleton, so only one
 * TranslateButton may mount per page — the Header owns it on every route
 * except "/", where the hero banner owns it instead.
 */
let translateScriptPromise: Promise<void> | null = null;

/** Bounded retry counter for the init callback (see googleTranslateElementInit). */
let initRetries = 0;
const MAX_INIT_RETRIES = 20; // 20 × 250 ms ≈ 5 s before giving up

function loadTranslateScript(): Promise<void> {
  if (translateScriptPromise) return translateScriptPromise;

  window.googleTranslateElementInit = () => {
    const translate = window.google?.translate;
    // Two races in element.js: the callback can fire before InlineLayout is
    // populated, and it fires during script execution — before React has
    // rendered the widget div (it is gated on `ready`). Retry on the next
    // tick until both are available, then stop after ~5 s so a pathological
    // API state cannot spin a timer forever.
    if (
      !translate?.TranslateElement ||
      !translate.InlineLayout ||
      !document.getElementById("google_translate_element")
    ) {
      if (initRetries < MAX_INIT_RETRIES) {
        initRetries += 1;
        window.setTimeout(() => window.googleTranslateElementInit?.(), 250);
      }
      return;
    }
    initRetries = 0;
    new translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: TRANSLATE_LANGUAGES,
        autoDisplay: false,
        layout: translate.InlineLayout.SIMPLE,
      },
      "google_translate_element"
    );
  };

  translateScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TRANSLATE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Translate."));
    document.head.appendChild(script);
  });

  return translateScriptPromise;
}

interface TranslateButtonProps {
  /**
   * "header" for the always-dark sticky bar, "hero" for the light-first
   * landing nav (which also carries dark-mode variants).
   */
  variant?: "header" | "hero";
}

/**
 * Google Website Translator trigger styled to match the app's pill buttons.
 * Clicking anywhere on the pill opens the language dropdown (the widget
 * overlay covers the whole control — see `.translate-widget` in globals.css).
 * The AI diagnosis output has its own separate response-language selector.
 */
export function TranslateButton({ variant = "header" }: TranslateButtonProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTranslateScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // Script blocked (offline/network)? The pill stays as a label-only
        // control — translation is progressive enhancement, never a blocker.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        variant === "hero"
          ? "border-zinc-200/80 bg-white/70 text-zinc-500 backdrop-blur hover:border-brand/40 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-white"
          : "border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
      )}
      role="group"
      aria-label="Translate this page"
    >
      <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">Translate</span>
      {/* The widget must be present for Google to render its trigger; it is
          overlaid invisibly over the whole pill (see .translate-widget). The
          widget's own trigger text is hidden with font-size:0 (CSS), which is
          a known third-party a11y limitation — our group label names the
          control. Note for future CSP work: this relies on scripts from
          translate.google.com + www.gstatic.com and a Google menu iframe. */}
      {ready && <div id="google_translate_element" className="translate-widget" />}
    </div>
  );
}
