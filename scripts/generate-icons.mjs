// One-off: rasterize the app icon SVG into the PNG sizes a PWA needs.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(outDir, { recursive: true })

const BG = '#1976d2'
// Full-bleed background + centered white "home" glyph (safe for maskable).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(88,96) scale(14)" fill="#ffffff">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-maskable-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(buf).resize(size, size).png().toFile(join(outDir, file))
  console.log('wrote', file)
}
console.log('done')
