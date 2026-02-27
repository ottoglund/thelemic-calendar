import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, "public", "icons");

const input = path.join(ICONS_DIR, "master.png");

if (!fs.existsSync(input)) {
  console.error("Hittar inte:", input);
  console.error("Lägg master.png i public/icons/");
  process.exit(1);
}

// Skapar en “cover”-crop så att kvadraten fylls snyggt
async function makeSquarePng(size, outName) {
  const outPath = path.join(ICONS_DIR, outName);
  await sharp(input)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log("Skapad:", outPath);
}

(async () => {
  // PWA
  await makeSquarePng(192, "icon-192.png");
  await makeSquarePng(512, "icon-512.png");

  // iOS “Add to Home Screen” (180 är standard)
  await makeSquarePng(180, "apple-touch-icon.png");

  // (Valfritt men bra): en högupplöst version om du vill
  await makeSquarePng(1024, "icon-1024.png");

  console.log("✅ Klart! Bygg sedan med: npm run build");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});