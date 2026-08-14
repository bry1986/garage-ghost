"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Languages, Loader2 } from "lucide-react";
import {
  getCurrentLang,
  getNativeLabel,
  handleRouteChange,
  initPageTranslation,
  setPageLang,
  subscribe,
  TRANSLATE_LANGUAGES,
  type TranslateLang,
} from "@/lib/translate";
import { cn } from "@/lib/utils";

interface TranslateButtonProps {
  /**
   * "header" for the always-dark sticky bar, "hero" for the light-first
   * landing nav (which also carries dark-mode variants).
   */
  variant?: "header" | "hero";
}

/**
 * Language switcher for the whole page. Replaces Google's retired Website
 * Translator widget with our own dropdown + client-side translator (see
 * lib/translate.ts). Selecting a language instantly translates the page in
 * place; the choice persists across visits. The AI diagnosis output keeps its
 * own separate response-language selector.
 */
export function TranslateButton({ variant = "header" }: TranslateButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<TranslateLang>(() => getCurrentLang());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Boot the translator once; on every route change (SPA nav) the saved
  // language is re-applied to the freshly rendered English DOM.
  useEffect(() => {
    initPageTranslation();
    handleRouteChange();
  }, [pathname]);

  // Keep the pill / checkmark in sync with the active language.
  useEffect(
    () =>
      subscribe(() => {
        setLang(getCurrentLang());
      }),
    []
  );

  // Move focus to the active language when the menu opens (menu pattern).
  useEffect(() => {
    if (!open) return;
    const active = menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
    (active ?? menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"]'))?.focus();
  }, [open]);

  // Close on outside click or Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const choose = (code: TranslateLang) => {
    if (code === lang) return;
    setError(null);
    setBusy(true);
    setPageLang(code, true)
      .then(() => setOpen(false))
      .catch(() => {
        // Both the direct call and the proxy failed — tell the user instead of
        // failing silently (the page simply stays in its current language).
        setError("Translation failed — check your connection and retry.");
        setOpen(true);
      })
      .finally(() => setBusy(false));
  };

  const activeLabel = getNativeLabel(lang);

  return (
    <div ref={rootRef} className="relative shrink-0" data-skip-translate>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Translate this page"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          variant === "hero"
            ? "border-zinc-200/80 bg-white/70 text-zinc-500 backdrop-blur hover:border-brand/40 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-white"
            : "border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="hidden sm:inline">{lang === "en" ? "Translate" : activeLabel}</span>
        <ChevronDown
          className={cn(
            "hidden h-3 w-3 transition-transform duration-200 sm:block",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Choose a language"
          className={cn(
            "translate-menu-pop absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border p-1 shadow-xl",
            variant === "hero"
              ? "border-zinc-200/90 bg-white shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-900"
              : "border-zinc-700/80 bg-zinc-900 shadow-black/40"
          )}
        >
          {TRANSLATE_LANGUAGES.map((item) => {
            const active = lang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(item.code)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-brand/15 font-semibold text-brand"
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
                )}
              >
                <span>{item.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              </button>
            );
          })}
          {error && (
            <p
              role="alert"
              className="border-t border-black/10 px-3 pb-2 pt-2 text-xs text-amber-600 dark:border-white/10 dark:text-amber-400"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
