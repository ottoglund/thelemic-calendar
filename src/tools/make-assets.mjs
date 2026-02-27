import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const masterSvgPath = path.join(root, "public", "icons", "master.svg");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(splashDir, { recursive: true });

if (!fs.existsSync(masterSvgPath)) {
  console.error("Hittar inte master.svg här:", masterSvgPath);
  process.exit(1);
}

const svgBuffer = fs.readFileSync(masterSvgPath);

// Ikoner
const icons = [
  { file: "icon-512.png", w: 512, h: 512 },
  { file: "icon-192.png", w: 192, h: 192 },
  { file: "apple-touch-icon.png", w: 180, h: 180 },
];

// Splash (iOS)
const splashes = [
  { file: "iphone-1170x2532.png", w: 1170, h: 2532 },
  { file: "iphone-1290x2796.png", w: 1290, h: 2796 },
  { file: "iphone-1284x2778.png", w: 1284, h: 2778 },
  { file: "iphone-750x1334.png",  w: 750,  h: 1334 },
  { file: "ipad-1536x2048.png",   w: 1536, h: 2048 },
  { file: "ipad-1668x2388.png",   w: 1668, h: 2388 },
  { file: "ipad-2048x2732.png",   w: 2048, h: 2732 },
];

async function render(outPath, w, h, mode = "contain") {
  // contain = behåll proportioner, lägg svart padding (perfekt för splash)
  // cover = fyll hela ytan (kan beskära)
  const img = sharp(svgBuffer, { density: 300 })
    .resize(w, h, {
      fit: mode,
      background: "#000000",
    })
    .png();

  await img.toFile(outPath);
}

(async () => {
  // Icons: cover (fyll kvadrat)
  for (const i of icons) {
    const out = path.join(iconsDir, i.file);
    await render(out, i.w, i.h, "cover");
    console.log("Skapade", out);
  }

  // Splashes: contain (centrera, svart bakgrund runt)
  for (const s of splashes) {
    const out = path.join(splashDir, s.file);
    await render(out, s.w, s.h, "contain");
    console.log("Skapade", out);
  }

  console.log("Klart ✅");
})();