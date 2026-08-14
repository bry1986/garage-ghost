import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = process.argv[2] || "https://garage-ghost.vercel.app/";

const consoleErrors = [];
const pageErrors = [];
const translateRequests = []; // { url, durationMs, ok, status }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`[console.error] ${msg.text()}`);
});
page.on("pageerror", (err) => pageErrors.push(`[pageerror] ${err.message}`));
page.on("response", (res) => {
  const url = res.url();
  if (/translate_a\/single|api\/translate/.test(url)) {
    translateRequests.push({ url: url.slice(0, 120), status: res.status(), ok: res.ok() });
  }
});

const state = () =>
  page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 70) ?? null,
  }));

// Poll until documentElement.lang becomes `expected` or timeout.
async function waitForLang(expected, maxMs) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const s = await state();
    if (s.lang === expected) return { ok: true, ms: Date.now() - start, state: s };
    await new Promise((r) => setTimeout(r, 500));
  }
  return { ok: false, ms: Date.now() - start, state: await state() };
}

async function menuOpen() {
  return page.evaluate(() => !!document.querySelector('[role="menu"]'));
}
async function ensureMenuOpen() {
  if (!(await menuOpen())) {
    await page.click('button[aria-label="Translate this page"]');
    await new Promise((r) => setTimeout(r, 600));
  }
}
async function choose(label) {
  await ensureMenuOpen();
  return page.evaluate((label) => {
    const items = [...document.querySelectorAll('[role="menuitemradio"]')];
    const target = items.find((b) => (b.textContent || "").includes(label));
    if (!target) return false;
    target.click();
    return true;
  }, label);
}

console.log("=== goto ===");
await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

console.log("initial:", JSON.stringify(await state()));

console.log("\n=== Français ===");
const fr = await choose("Français");
console.log("clicked:", fr);
const frResult = await waitForLang("fr", 20000);
console.log("lang=fr reached:", frResult.ok, "in", frResult.ms, "ms");
console.log("final:", JSON.stringify(frResult.state));

console.log("\n=== العربية ===");
const ar = await choose("العربية");
console.log("clicked:", ar);
const arResult = await waitForLang("ar", 20000);
console.log("lang=ar reached:", arResult.ok, "in", arResult.ms, "ms");
console.log("dir:", arResult.state.dir, "| h1:", arResult.state.h1);

console.log("\n=== English ===");
const en = await choose("English");
console.log("clicked:", en);
const enResult = await waitForLang("en", 20000);
console.log("lang=en reached:", enResult.ok, "in", enResult.ms, "ms");
console.log("h1:", enResult.state.h1);

console.log("\n=== translate network calls ===");
for (const t of translateRequests) console.log(JSON.stringify(t));

console.log("\n=== CONSOLE ERRORS ===");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(none)");
console.log("=== PAGE ERRORS ===");
console.log(pageErrors.length ? pageErrors.join("\n") : "(none)");

await browser.close();
