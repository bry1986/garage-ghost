/**
 * Client-side page translator.
 *
 * Google retired the classic "Website Translator" widget (translate_a/element.js)
 * — the script now ships a stub, so the old TranslateButton rendered a pill with
 * nothing behind it. This module reimplements the same instant in-place
 * translation UX with our own dropdown, talking to Google's public `gtx`
 * endpoint (the same engine Google Translate uses):
 *
 *   https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=...
 *
 * No third-party script tag, no API key, CORS-enabled from browsers. Text is
 * sent to Google only when the visitor actively translates the page (same
 * trade-off the widget made).
 *
 * Design notes:
 *  - Original English text is preserved per text node (WeakMap, auto-GC), so
 *    switching languages always re-translates from the source and switching
 *    back to English restores it exactly.
 *  - Translations are cached per language (session memory + localStorage, capped)
 *    so re-visits and SPA navigations apply instantly without re-fetching.
 *  - A MutationObserver re-translates content that renders after navigation or
 *    after async work (e.g. the diagnosis result) — only nodes not already
 *    translated are touched, so it never loops.
 *  - Elements holding code, prices, user input, AI-generated reports and our own
 *    controls are skipped via `data-skip-translate` / the skip selector — machine
 *    translation must never mangle a VIN, a DTC code, or a French AI report.
 */

export const TRANSLATE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
] as const;

export type TranslateLang = (typeof TRANSLATE_LANGUAGES)[number]["code"];

const GTX_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const STORAGE_KEY = "gg-page-lang";
const CACHE_PREFIX = "gg-trans-";
const CACHE_MAX_ENTRIES = 400;
const BATCH_SIZE = 60;

const RTL_LANGS: ReadonlySet<string> = new Set(["ar"]);

/**
 * Elements whose text must never be machine-translated: scripts, code blocks,
 * form controls, print-only output, monospace values (VINs, DTC codes, prices)
 * and anything marked `data-skip-translate` (AI reports, user-entered names).
 */
const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "svg",
  "code",
  "pre",
  "textarea",
  "select",
  "option",
  "[data-skip-translate]",
  ".print-report",
  ".font-mono",
].join(",");

/** Standalone codes / prices / numbers — sending them would risk mangling. */
const SKIP_TEXT_RE = /^[\s$€£¥0-9,.\-–—%°():/\\+*<>≈~=]+$/;

/* ------------------------------ session state ----------------------------- */

/** Original English text for every text node we have translated (auto-GC'd). */
const originals = new WeakMap<Text, string>();
/** Placeholder attributes we have translated (per element). */
const placeholderOriginals = new WeakMap<Element, string>();

/** Nodes currently holding a translation — used to restore English. */
const translatedNodes = new Map<Text, string>();
const translatedPlaceholders = new Set<Element>();

/** Per-language translation cache: lang -> (source text -> translation). */
const cache = new Map<string, Map<string, string>>();

let currentLang: TranslateLang = "en";
/** The language currently applied or in flight — guards against duplicate/raced calls. */
let pendingLang: TranslateLang = "en";
let busy: Promise<void> = Promise.resolve();
let observer: MutationObserver | null = null;
let inited = false;

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function getCurrentLang(): TranslateLang {
  return currentLang;
}

export function getNativeLabel(lang: TranslateLang): string {
  return TRANSLATE_LANGUAGES.find((item) => item.code === lang)?.label ?? "Translate";
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ------------------------------ cache helpers ----------------------------- */

function getCache(lang: TranslateLang): Map<string, string> {
  const existing = cache.get(lang);
  if (existing) return existing;

  let seeded = new Map<string, string>();
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang);
    if (raw) seeded = new Map(Object.entries(JSON.parse(raw) as Record<string, string>));
  } catch {
    // Corrupt/blocked storage — start fresh.
  }
  cache.set(lang, seeded);
  return seeded;
}

function persistCache(lang: TranslateLang) {
  const map = cache.get(lang);
  if (!map) return;
  try {
    const entries = [...map.entries()];
    const trimmed = entries.slice(-CACHE_MAX_ENTRIES);
    // Keep the in-memory map in sync with what we persisted.
    if (trimmed.length !== entries.length) {
      cache.set(lang, new Map(trimmed));
    }
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // Quota exceeded / blocked — in-memory cache still works for this session.
  }
}

/* ------------------------------ DOM collection ---------------------------- */

function isSkipped(element: Element | null): boolean {
  return Boolean(element && element.closest(SKIP_SELECTOR));
}

interface TextItem {
  node: Text;
  source: string;
}

interface PlaceholderItem {
  el: Element;
  attr: "placeholder";
  source: string;
}

/** Collect translatable text nodes and input placeholders below a root. */
function collectItems(root: ParentNode): { texts: TextItem[]; placeholders: PlaceholderItem[] } {
  const texts: TextItem[] = [];
  const placeholders: PlaceholderItem[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const parent = node.parentElement;
    if (!parent || isSkipped(parent)) continue;
    const current = node.nodeValue ?? "";

    // React reuses Text nodes and updates them with characterData writes (e.g.
    // "Run Diagnosis" -> "Analyzing…"). If a node's content changed after we
    // translated it, re-baseline the original so we never clobber React's new
    // text with a stale translation of the old text.
    const storedTranslation = translatedNodes.get(node);
    if (storedTranslation !== undefined && current !== storedTranslation) {
      originals.set(node, current);
      translatedNodes.delete(node);
    } else if (originals.has(node) && current !== originals.get(node)) {
      originals.set(node, current);
    }

    const source = originals.get(node) ?? current;
    if (source.trim().length === 0) continue;
    if (SKIP_TEXT_RE.test(source)) continue;
    if (!originals.has(node)) originals.set(node, source);
    texts.push({ node, source });
  }

  const inputs = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input[placeholder], textarea[placeholder]"
  );
  for (const el of inputs) {
    if (isSkipped(el)) continue;
    const source = placeholderOriginals.get(el) ?? el.getAttribute("placeholder") ?? "";
    if (source.trim().length === 0) continue;
    if (!placeholderOriginals.has(el)) placeholderOriginals.set(el, source);
    placeholders.push({ el, attr: "placeholder", source });
  }

  return { texts, placeholders };
}

/* ------------------------------- translation ------------------------------ */

async function fetchTranslations(sources: string[], lang: TranslateLang): Promise<string[]> {
  const params = new URLSearchParams({ client: "gtx", sl: "en", tl: lang, dt: "t" });
  for (const source of sources) params.append("q", source);

  const res = await fetch(`${GTX_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error(`Translate request failed (HTTP ${res.status})`);
  const data = (await res.json()) as unknown[];
  const segments = (data?.[0] as unknown[]) ?? [];

  return sources.map((_, index) => {
    const segment = segments[index] as unknown[] | undefined;
    const translated = segment?.[0];
    return typeof translated === "string" && translated.length > 0 ? translated : sources[index];
  });
}

/** Translate every collected item (cache-first, then batched network calls). */
async function translateItems(
  items: Array<TextItem | PlaceholderItem>,
  lang: TranslateLang
): Promise<void> {
  if (items.length === 0) return;
  const langCache = getCache(lang);

  const pending: Array<TextItem | PlaceholderItem> = [];
  for (const item of items) {
    if (!langCache.has(item.source)) pending.push(item);
  }

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    const results = await fetchTranslations(
      chunk.map((item) => item.source),
      lang
    );
    chunk.forEach((item, index) => {
      const translation = results[index];
      if (translation && translation !== item.source) {
        langCache.set(item.source, translation);
        if ("node" in item) {
          item.node.nodeValue = translation;
          translatedNodes.set(item.node, translation);
        } else {
          item.el.setAttribute(item.attr, translation);
          translatedPlaceholders.add(item.el);
        }
      }
    });
    persistCache(lang);
  }
}

function translateTo(lang: TranslateLang): Promise<void> {
  const { texts, placeholders } = collectItems(document.body);
  return translateItems([...texts, ...placeholders], lang).then(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  });
}

function restoreEnglish(): Promise<void> {
  for (const [node] of translatedNodes) {
    node.nodeValue = originals.get(node) ?? node.nodeValue;
  }
  for (const el of translatedPlaceholders) {
    el.setAttribute("placeholder", placeholderOriginals.get(el) ?? "");
  }
  translatedNodes.clear();
  translatedPlaceholders.clear();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  return Promise.resolve();
}

/* -------------------------------- public API ------------------------------ */

export function getSavedLang(): TranslateLang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (
      saved &&
      TRANSLATE_LANGUAGES.some((item) => item.code === saved)
    ) {
      return saved as TranslateLang;
    }
  } catch {
    // Storage blocked — fall through to English.
  }
  return "en";
}

/**
 * Switch the whole page to `lang`. English restores the original text;
 * any other language translates from the preserved English originals.
 * Calls are serialized so rapid language switches can't interleave DOM writes.
 */
export function setPageLang(lang: TranslateLang, persist = true): Promise<void> {
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage blocked — session-only translation is fine.
    }
  }
  // Guard against the language already being applied *or queued*: currentLang
  // only updates after async work, so checking it alone would swallow a switch
  // made while an earlier request is still in flight.
  if (lang === pendingLang) return busy;
  pendingLang = lang;

  const run = busy.then(async () => {
    if (lang === "en") {
      await restoreEnglish();
    } else {
      await translateTo(lang);
    }
    currentLang = lang;
    notify();
  }).finally(() => {
    if (pendingLang === lang) pendingLang = currentLang;
  });
  busy = run.catch(() => {
    // Network/parse failure — keep the page as-is (English or previous lang).
  });
  return run;
}

/**
 * Boot once per app load: apply the saved language after first paint and watch
 * for late-rendered content (async results, modals) so it gets translated too.
 */
export function initPageTranslation(): void {
  if (inited) return;
  inited = true;

  // Debounce bursts of DOM churn (form steps, result render, etc.). Only
  // nodes not already translated are touched, so re-running never loops.
  // characterData catches React's in-place text updates (button labels, live
  // counters) — collectItems re-baselines those before translating.
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  observer = new MutationObserver(() => {
    if (currentLang === "en") return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const lang = currentLang;
      void setPageLang(lang, false);
    }, 350);
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
}

/**
 * Called on every route change (SPA navigation). The DOM is brand-new English,
 * so session translation state is cleared and the saved language re-applied.
 */
export function handleRouteChange(): void {
  translatedNodes.clear();
  translatedPlaceholders.clear();
  currentLang = "en"; // fresh server-rendered DOM is English
  pendingLang = "en";
  const saved = getSavedLang();
  if (saved !== "en") void setPageLang(saved, false);
}
