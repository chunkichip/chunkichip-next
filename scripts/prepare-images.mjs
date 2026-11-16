// Run at build time so the customer-facing server never has to resize these assets.
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
const sources = ['boxes/1-box.png', 'boxes/2-box.png', 'boxes/4-box.png', 'boxes/6-box.png', 'boxes/12-box.png', 'open-shipping-box.webp'];
const widths = [320, 640, 960, 1280, 1920];
async function main() {
  sharp.cache(false);
  sharp.concurrency(1);
  for (const source of sources) {
    const stem = source.replace(/\.[^.]+$/, '');
    for (const width of widths) {
      const destination = path.join('public/prepared', `${stem}-${width}.webp`);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await sharp(path.join('public', source)).resize({ width }).webp({ quality: 85, alphaQuality: 100 }).toFile(destination);
    }
  }
  console.log(`Prepared ${sources.length * widths.length} responsive images.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
