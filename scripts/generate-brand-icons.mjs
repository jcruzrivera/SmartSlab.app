/**
 * Regenerates favicon, apple-touch, and PWA icons from the brand SVG master.
 *
 * Usage: npm run brand:icons
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const masterSvg = path.join(root, "public", "brand", "smartslab-mark.svg");

async function renderPng(size, dest, { paddingRatio = 0 } = {}) {
  const svg = await readFile(masterSvg);
  let pipeline = sharp(svg).resize(size, size, { fit: "fill" });

  if (paddingRatio > 0) {
    const pad = Math.round(size * paddingRatio);
    const inner = size - pad * 2;
    const innerBuf = await sharp(svg)
      .resize(inner, inner, { fit: "fill" })
      .png()
      .toBuffer();
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 27, g: 176, b: 206, alpha: 1 },
      },
    }).composite([{ input: innerBuf, left: pad, top: pad }]);
  }

  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline.png().toFile(dest);
  console.log("✓", path.relative(root, dest), `${size}x${size}`);
}

async function main() {
  const iconsDir = path.join(root, "public", "icons");
  const appDir = path.join(root, "app");

  await renderPng(1024, path.join(iconsDir, "icon-1024.png"));
  await renderPng(512, path.join(iconsDir, "icon-512.png"));
  await renderPng(192, path.join(iconsDir, "icon-192.png"));
  await renderPng(512, path.join(iconsDir, "icon-512-maskable.png"), {
    paddingRatio: 0.12,
  });

  await renderPng(180, path.join(appDir, "apple-icon.png"));
  await renderPng(512, path.join(appDir, "icon.png"));

  const icoSizes = [16, 32, 48];
  const icoBuffers = [];
  for (const size of icoSizes) {
    const buf = await sharp(await readFile(masterSvg))
      .resize(size, size, { fit: "fill" })
      .png()
      .toBuffer();
    icoBuffers.push(buf);
  }
  const ico = await pngToIco(icoBuffers);
  await writeFile(path.join(appDir, "favicon.ico"), ico);
  console.log("✓ app/favicon.ico (16/32/48)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
