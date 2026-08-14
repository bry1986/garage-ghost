import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for Google's public `gtx` translation endpoint.
 *
 * The client normally calls translate.googleapis.com directly, but some
 * visitors have that domain blocked (ad-blockers, privacy extensions,
 * corporate/restricted networks) — a direct call then fails silently and the
 * page never translates. This route re-runs the same request from Vercel's
 * servers, so translation keeps working as long as the visitor can reach our
 * own domain. Requests are capped and origin-checked to keep it from being
 * used as an open proxy.
 */

const GTX_ENDPOINT = "https://translate.googleapis.com/translate_a/single";

const ALLOWED_LANGS = new Set(["en", "fr", "ar", "es", "de"]);
const MAX_ITEMS = 120;
// Guide/blog pages have long paragraph text nodes; a cap too low would fail a
// whole batch for the very users who need the proxy (direct call blocked).
const MAX_ITEM_LENGTH = 5000;

/**
 * Only browser requests from our own app may use the proxy. This is an
 * anti-abuse *deterrent*, not a security boundary (Origin is spoofable) — the
 * item/length caps are what bound each request. Add any custom domain here.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return (
      host === "localhost:3000" ||
      host === "127.0.0.1:3000" ||
      host === "garage-ghost.vercel.app" ||
      host.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const rawQ = (body as { q?: unknown }).q;
  const tl = (body as { tl?: unknown }).tl;
  const q = Array.isArray(rawQ) ? rawQ.filter((item): item is string => typeof item === "string") : [];

  if (
    typeof tl !== "string" ||
    !ALLOWED_LANGS.has(tl) ||
    q.length === 0 ||
    q.length > MAX_ITEMS
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (q.some((item) => item.length > MAX_ITEM_LENGTH)) {
    return NextResponse.json({ error: "text too long" }, { status: 413 });
  }

  // gtx only honors the FIRST `q` param — repeated params are ignored. Join
  // with a sentinel instead (echoed back verbatim) so the client can split the
  // response per source even when Google splits long lines at sentence
  // boundaries. Must match BATCH_SENTINEL in src/lib/translate.ts.
  const BATCH_SENTINEL = "@@GG_SEP_7f3a2b@@";
  const params = new URLSearchParams({ client: "gtx", sl: "en", tl, dt: "t" });
  params.set("q", q.map((item) => item.replace(/\r?\n/g, " ")).join(`\n${BATCH_SENTINEL}\n`));

  try {
    const res = await fetch(`${GTX_ENDPOINT}?${params.toString()}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as unknown[];
    const segments = (data?.[0] as unknown[] | undefined) ?? [];
    // Return the raw [translated, echo] pairs exactly as gtx shaped them, so the
    // client can run the same alignment check (segment count + source echo) it
    // uses on the direct path. Translating/passing plain strings here would
    // break parseSegments' `segment[1]` echo lookup.
    return NextResponse.json({
      segments: segments.map((seg) => {
        if (!Array.isArray(seg)) return ["", ""];
        return [
          typeof seg[0] === "string" ? seg[0] : "",
          typeof seg[1] === "string" ? seg[1] : "",
        ];
      }),
    });
  } catch {
    return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
  }
}
