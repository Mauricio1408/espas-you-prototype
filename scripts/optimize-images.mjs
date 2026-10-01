// Converts every PNG/JPG in .figma-src to WebP in public/figma (max 1320px wide,
// i.e. 3x the 440pt artboard). Screens reference the .webp files.
import { readdirSync, existsSync, statSync } from 'node:fs';
import sharp from 'sharp';
const dir = new URL('../.figma-src/', import.meta.url);
const outDir = new URL('../public/figma/', import.meta.url);
for (const f of readdirSync(dir)) {
  if (!/\.(png|jpe?g)$/i.test(f)) continue;
  const src = new URL(f, dir);
  const out = new URL(f.replace(/\.(png|jpe?g)$/i, '.webp'), outDir);
  if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs) continue;
  const img = sharp(src.pathname.replace(/^\/([A-Z]:)/, '$1'));
  const meta = await img.metadata();
  await img
    .resize({ width: Math.min(meta.width ?? 1320, f.startsWith('map') ? 1920 : 1320), withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out.pathname.replace(/^\/([A-Z]:)/, '$1'));
  console.log(`${f} ${(statSync(src).size / 1e6).toFixed(1)}MB → ${(statSync(out).size / 1e3).toFixed(0)}KB`);
}
