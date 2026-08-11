"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "garage-ghost:theme";

/**
 * Resolve the effective theme before React hydrates — also used by the inline
 * FOUC guard in layout.tsx. Saved choice wins; otherwise follow the system.
 */
export function resolveTheme(stored: string | null): Theme {
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Client-side only: the FOUC guard in layout.tsx already applied the right
    // class before first paint, so this initial state just needs to agree.
    if (typeof window === "undefined") return "light";
    return resolveTheme(window.localStorage.getItem(STORAGE_KEY));
  });

  // Apply the class and keep the OS-level meta color in sync for mobile chrome.
  // Note: the choice is NOT persisted here — storage is written only when the
  // visitor explicitly toggles (see toggleTheme). That keeps system-preference
  // users following OS changes live until they make an explicit choice.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // If the visitor never chose a theme, follow OS changes live.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (stored !== "light" && stored !== "dark") {
        setTheme(event.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable — theme still applies for this session */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
