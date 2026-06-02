/**
 * gdd-logo-header.png: przezroczyste tło, granat → biały (z zachowaniem antyaliasingu), złoto bez zmian.
 * public/favicon*.png + icon.svg (nie favicon.svg — ta ścieżka daje 404 w astro dev).
 * Źródło: src/assets/gdd-logo.png (zalecane min. ~440×464 px).
 * Uruchom: node scripts/build-header-logo.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const input = "src/assets/gdd-logo.png";
const output = "src/assets/gdd-logo-header.png";

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

/** Złoty trójkąt / pałka — ciepły, jasny metal. */
function isGold(r, g, b) {
  const max = Math.max(r, g, b);
  if (max < 70) return false;
  const [h, s, l] = rgbToHsl(r, g, b);
  const hueDeg = h * 360;
  const warmHue = hueDeg >= 18 && hueDeg <= 75;
  const warmRgb = r > 95 && g > 65 && r >= b + 12 && r + g > b * 1.6;
  return (warmHue && s > 0.12 && l > 0.22) || (warmRgb && s > 0.08);
}

function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 38 && min < 30;
}

/** Granat / ciemny niebieski napis — bez rozszerzania na złoto. */
function isNavy(r, g, b) {
  if (isGold(r, g, b)) return false;
  const max = Math.max(r, g, b);
  if (max < 40) return false;
  const [h, s, l] = rgbToHsl(r, g, b);
  const hueDeg = h * 360;
  const blueHue = hueDeg >= 185 && hueDeg <= 275;
  const blueRgb = b >= r + 4 && b >= g - 8 && max < 210;
  return (blueHue && s > 0.08 && l < 0.72) || (blueRgb && s > 0.06 && l < 0.65);
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  let a = data[i + 3];

  if (isBackground(r, g, b)) {
    data[i + 3] = 0;
    continue;
  }

  if (isGold(r, g, b)) continue;

  if (isNavy(r, g, b)) {
    const [, , l] = rgbToHsl(r, g, b);
    const white = Math.round(Math.min(255, 228 + l * 100));
    data[i] = white;
    data[i + 1] = white;
    data[i + 2] = white;
    data[i + 3] = Math.max(a, Math.round(80 + l * 175));
    continue;
  }
}

// Drugi przebieg: usuń ciemną obwódkę wokół białego tekstu (szare/czarne frędzle)
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 8) continue;
  if (isGold(r, g, b)) continue;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;

  const isLight = max > 200;
  const isDarkFringe = max < 120 && sat < 0.35;
  const isMuddyMid = max >= 120 && max < 200 && sat < 0.12;

  if (isDarkFringe) {
    data[i + 3] = 0;
    continue;
  }

  if (isMuddyMid || (isLight && sat < 0.08)) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.max(a, 230);
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`Zapisano ${output} (${info.width}×${info.height})`);

const faviconBg = { r: 0, g: 0, b: 0, alpha: 1 };

async function writeFavicon(size, path) {
  await sharp(output)
    .trim()
    .resize(size, size, { fit: "contain", background: faviconBg })
    .png()
    .toFile(path);
}

await writeFavicon(32, "public/favicon.png");
await writeFavicon(192, "public/favicon-192.png");
await writeFavicon(180, "public/apple-touch-icon.png");

const favicon32 = readFileSync("public/favicon.png");
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Gospoda Dobrego Dźwięku">
  <image width="32" height="32" href="data:image/png;base64,${favicon32.toString("base64")}"/>
</svg>
`;
writeFileSync("public/icon.svg", faviconSvg, "utf8");

console.log(
  "Zapisano favicony: public/favicon.png, favicon-192.png, apple-touch-icon.png, icon.svg",
);
