import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = process.argv[2] || "http://localhost:3000/diagnose";

const consoleErrors = [];
const pageErrors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--no-first-run"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => pageErrors.push(e.message));

const snap = () =>
  page.evaluate(() => {
    const alert = document.querySelector('[aria-label="Emergency safety warning"]');
    const navDiagnose = [...document.querySelectorAll("header a")].find(
      (a) => a.getAttribute("href") === "/diagnose"
    )?.textContent?.trim() ?? null;
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      path: location.pathname,
      h1: document.querySelector("h1")?.textContent?.trim()?.slice(0, 50) ?? null,
      navDiagnose,
      bannerHeading: alert?.querySelector("h2")?.textContent?.trim() ?? null,
      makePlaceholder: document.querySelector('select#brand option[value=""]')?.textContent ?? null,
    };
  });

async function waitFor(fn, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  return await fn();
}

async function choose(label) {
  if (!(await page.evaluate(() => !!document.querySelector('[role="menu"]')))) {
    await page.click('button[aria-label="Translate this page"]');
    await new Promise((r) => setTimeout(r, 500));
  }
  await page.evaluate((label) => {
    [...document.querySelectorAll('[role="menuitemradio"]')]
      .find((b) => (b.textContent || "").includes(label))?.click();
  }, label);
}

const pass = (name, cond, extra = "") =>
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  | " + extra : ""}`);

console.log("=== 1. load /diagnose, translate العربية ===");
await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1000));
await choose("العربية");
await waitFor(async () => (await snap()).lang === "ar", 25000);
let s = await snap();
pass("document dir = rtl", s.dir === "rtl", s.dir);
pass("banner heading Arabic", s.bannerHeading !== "Stop safely", s.bannerHeading);
pass("make placeholder Arabic", s.makePlaceholder !== "Select make…", s.makePlaceholder);

console.log("\n=== 2. SPA navigate -> /faq ===");
await page.click('header nav a[href="/faq"]');
await waitFor(async () => (await snap()).path === "/faq", 15000);
s = await waitFor(async () => {
  const x = await snap();
  return x.lang === "ar" && x.h1 !== "Frequently asked questions" ? x : null;
}, 15000);
pass("faq h1 translated", s.h1 !== "Frequently asked questions", s.h1);
pass("faq lang = ar", s.lang === "ar", s.lang);
pass("cached nav 'Diagnose' Arabic", s.navDiagnose !== "Diagnose", s.navDiagnose);

console.log("\n=== 3. SPA navigate back -> /diagnose ===");
await page.click('header nav a[href="/diagnose"]');
await waitFor(async () => (await snap()).path === "/diagnose", 15000);
s = await waitFor(async () => {
  const x = await snap();
  return x.lang === "ar" && x.h1 !== "New Diagnosis" ? x : null;
}, 15000);
pass("diagnose h1 Arabic", s.h1 !== "New Diagnosis", s.h1);
pass("banner heading Arabic again", s.bannerHeading !== "Stop safely", s.bannerHeading);

console.log("\n=== 4. switch back to English ===");
await choose("English");
await waitFor(async () => (await snap()).lang === "en", 15000);
s = await snap();
pass("h1 restored exactly", s.h1 === "New Diagnosis", s.h1);
pass("nav 'Diagnose' restored", s.navDiagnose === "Diagnose", s.navDiagnose);
pass("banner heading restored", s.bannerHeading === "Stop safely", s.bannerHeading);
pass("make placeholder restored", s.makePlaceholder === "Select make…", s.makePlaceholder);
pass("dir restored ltr", s.dir === "ltr", s.dir);

console.log("\n=== CONSOLE ERRORS ===");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(none)");
console.log("=== PAGE ERRORS ===");
console.log(pageErrors.length ? pageErrors.join("\n") : "(none)");

await browser.close();
