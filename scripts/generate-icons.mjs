/**
 * Regenerates the PWA app icons, iOS launch splash screens, and the browser
 * favicon with the GG monogram brand mark (echo G + front G in a blue badge),
 * matching the in-app <Logo /> component.
 *
 * Run (from the project root):  node scripts/generate-icons.mjs
 *
 * Output (same filenames the manifest/sw.js already reference):
 *   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png,
 *   apple-touch-icon.png, public/icons/splash/*.png,
 *   and src/app/favicon.ico (16/32/48 multi-size ICO, replacing the stock
 *   Create-Next-App placeholder so direct /favicon.ico requests return the
 *   brand mark).
 *
 * Notes:
 * - Splash text falls back to Segoe UI/Arial when Space Grotesk is not
 *   installed on the machine running this script — the GG wordmark may then
 *   differ slightly from the in-app font.
 * - The tagline string below mirrors APP_TAGLINE in src/lib/constants.ts;
 *   keep them in sync.
 */
import sharp from "sharp";
import path from "node:path";
import { writeFile } from "node:fs/promises";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
const SPLASH_DIR = path.join(OUT_DIR, "splash");

// ---------------------------------------------------------------------------
// The GG monogram, drawn in a 48-unit box (same geometry as components/logo).
// bbox: x 5.25..39, y 8.25..29 → 33.75 x 20.75
// ---------------------------------------------------------------------------
const G_PATH = "M24 14 A12 12 0 1 0 36 26 L22 26";

function defs() {
  return `
    <linearGradient id="frontG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0" stop-color="#60a5fa"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="echoG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0" stop-color="rgb(161,161,170)" stop-opacity="0.85"/>
      <stop offset="1" stop-color="rgb(113,113,122)" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="rgb(37,99,235)" stop-opacity="0.07"/>
      <stop offset="1" stop-color="rgb(37,99,235)" stop-opacity="0"/>
    </radialGradient>`;
}

/** Amber badge + GG monogram, with badge origin (ox, oy) and box size B. */
function badge(ox, oy, B, aura = true) {
  const k = B / 44;
  const monoOx = ox + (B - 33.75 * k) / 2 - 5.25 * k;
  const monoOy = oy + (B - 20.75 * k) / 2 - 8.25 * k;
  return `
    ${aura ? `<rect x="${ox - B * 0.15}" y="${oy - B * 0.15}" width="${B * 1.3}" height="${B * 1.3}" rx="${B * 0.4}" fill="url(#auraG)"/>` : ""}
    <rect x="${ox}" y="${oy}" width="${B}" height="${B}" rx="${B * 0.3}" fill="rgb(37,99,235,0.12)" stroke="rgb(59,130,246,0.5)" stroke-width="${B * 0.028}"/>
    <g transform="translate(${monoOx}, ${monoOy}) scale(${k})">
      <path d="${G_PATH}" transform="translate(-4 -3)" stroke="url(#echoG)" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${G_PATH}" stroke="url(#frontG)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

// ---------------------------------------------------------------------------
// App icons — full-bleed zinc-950 with the badge centered.
// ---------------------------------------------------------------------------
function iconSvg(S, maskable) {
  const B = maskable ? S * 0.5 : S * 0.56;
  const o = (S - B) / 2;
  const auraDef = maskable
    ? ""
    : `<radialGradient id="auraG" cx="0.5" cy="0.5" r="0.5">
         <stop offset="0" stop-color="rgb(59,130,246)" stop-opacity="0.45"/>
         <stop offset="1" stop-color="rgb(59,130,246)" stop-opacity="0"/>
       </radialGradient>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs>${defs()}${auraDef}</defs>
    <rect width="${S}" height="${S}" fill="#09090b"/>
    <rect width="${S}" height="${S}" fill="url(#bgGlow)"/>
    ${badge(o, o, B, !maskable)}
  </svg>`;
}

// ---------------------------------------------------------------------------
// iOS launch splash screens — badge + GG wordmark + subtext + tagline,
// centered, matching the in-app SplashOverlay proportions (2x retina, so the
// CSS-px sizes from the overlay map to device px via w/2).
// ---------------------------------------------------------------------------
function splashSvg(w, h) {
  const cssW = w / 2;
  const badgeSize = 0.163 * cssW;
  const ggSize = 0.076 * cssW;
  const smallSize = 0.031 * cssW;
  const cx = w / 2;
  const badgeY = 0.42 * h;
  const ggY = 0.555 * h;
  const subY = 0.608 * h;
  const tagY = 0.672 * h;
  const font = `'Space Grotesk','Segoe UI',Arial,sans-serif`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${defs()}
      <radialGradient id="auraG" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="rgb(59,130,246)" stop-opacity="0.45"/>
        <stop offset="1" stop-color="rgb(59,130,246)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#09090b"/>
    <rect width="${w}" height="${h}" fill="url(#bgGlow)"/>
    ${badge(cx - badgeSize / 2, badgeY - badgeSize / 2, badgeSize)}
    <text x="${cx}" y="${ggY}" text-anchor="middle" font-family="${font}" font-size="${ggSize}" font-weight="700" letter-spacing="-0.02em" fill="#fafafa">GG</text>
    <text x="${cx}" y="${subY}" text-anchor="middle" font-family="${font}" font-size="${smallSize}" font-weight="500" letter-spacing="0.16em" fill="#71717a">GARAGE GHOST</text>
    <text x="${cx}" y="${tagY}" text-anchor="middle" font-family="${font}" font-size="${smallSize}" font-weight="400" fill="#71717a">Understand the warning. Choose the safe next step.</text>
  </svg>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`  ${path.basename(file)}  ${meta.width}x${meta.height}`);
}

// ---------------------------------------------------------------------------
// Browser favicon — classic multi-size ICO (16/32/48) with PNG-compressed
// entries (supported by every modern browser and Windows Vista+). Serves the
// GG badge to legacy browsers and direct /favicon.ico requests.
// ---------------------------------------------------------------------------
function packIco(pngs, sizes) {
  if (pngs.length !== sizes.length) {
    throw new Error(`packIco: ${pngs.length} PNGs but ${sizes.length} sizes`);
  }
  const count = pngs.length;
  const headerSize = 6;
  const entrySize = 16;
  const entries = [];
  const datas = [];
  let offset = headerSize + count * entrySize;
  for (let i = 0; i < count; i++) {
    const data = pngs[i];
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // width (0 = 256)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // height
    entry.writeUInt8(0, 2); // palette entries (unused for PNG)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += data.length;
    entries.push(entry);
    datas.push(data);
  }
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4); // image count
  return Buffer.concat([header, ...entries, ...datas]);
}

async function renderFavicon() {
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const s of sizes) {
    pngs.push(await sharp(Buffer.from(iconSvg(s, false))).png().toBuffer());
  }
  const ico = packIco(pngs, sizes);
  await writeFile(path.join(process.cwd(), "src", "app", "favicon.ico"), ico);
  console.log("  favicon.ico  (16/32/48 ICO)");
}

async function main() {
  console.log("Regenerating app icons…");
  const icons = [
    { file: "icon-192.png", size: 192, maskable: false },
    { file: "icon-512.png", size: 512, maskable: false },
    { file: "icon-maskable-512.png", size: 512, maskable: true },
    { file: "apple-touch-icon.png", size: 180, maskable: false },
  ];
  for (const { file, size, maskable } of icons) {
    await render(iconSvg(size, maskable), path.join(OUT_DIR, file));
  }

  console.log("Regenerating splash screens…");
  const splashes = [
    { file: "iPhone-SE-640x1136.png", w: 640, h: 1136 },
    { file: "iPhone-8-750x1334.png", w: 750, h: 1334 },
    { file: "iPhone-8Plus-1242x2208.png", w: 1242, h: 2208 },
    { file: "iPhone-X-1125x2436.png", w: 1125, h: 2436 },
    { file: "iPhone-XR-828x1792.png", w: 828, h: 1792 },
    { file: "iPhone-XSMax-1242x2688.png", w: 1242, h: 2688 },
    { file: "iPhone-12-1170x2532.png", w: 1170, h: 2532 },
    { file: "iPhone-12ProMax-1284x2778.png", w: 1284, h: 2778 },
    { file: "iPhone-14Pro-1179x2556.png", w: 1179, h: 2556 },
    { file: "iPhone-14ProMax-1290x2796.png", w: 1290, h: 2796 },
    { file: "iPad-768x1024-1536x2048.png", w: 1536, h: 2048 },
    { file: "iPad-Air-1668x2224.png", w: 1668, h: 2224 },
    { file: "iPad-Pro11-1668x2388.png", w: 1668, h: 2388 },
    { file: "iPad-Pro129-2048x2732.png", w: 2048, h: 2732 },
  ];
  for (const { file, w, h } of splashes) {
    await render(splashSvg(w, h), path.join(SPLASH_DIR, file));
  }

  console.log("Regenerating browser favicon…");
  await renderFavicon();

  console.log("Done — all icons, splash screens, and favicon regenerated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
