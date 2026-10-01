// Downloads every Figma asset listed in scripts/assets.json. Vectors go straight
// to public/figma/; rasters land in .figma-src/ and are converted to WebP by
// optimize-images.mjs. Figma MCP asset URLs expire after 7 days, so the
// shipped assets are committed to the repo.
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('./assets.json', import.meta.url)));
const out = new URL('../public/figma/', import.meta.url);
const raw = new URL('../.figma-src/', import.meta.url);
const jobs = Object.entries(manifest).map(async ([name, url]) => {
  const dest = new URL(name, /\.(png|jpe?g)$/i.test(name) ? raw : out);
  if (existsSync(dest) && statSync(dest).size > 0) return null;
  const res = await fetch(url);
  if (!res.ok) return `${name}: HTTP ${res.status}`;
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return null;
});
const errors = (await Promise.all(jobs)).filter(Boolean);
console.log(`${Object.keys(manifest).length} assets, ${errors.length} errors`);
errors.forEach((e) => console.log(' ', e));
