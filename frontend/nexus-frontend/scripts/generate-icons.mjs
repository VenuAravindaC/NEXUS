/**
 * generate-icons.mjs — one-off PWA icon generator.
 *
 * Creates public/icons/{icon-192,icon-512,apple-touch-icon}.png from the
 * NEXUS brand color (#1a1a1a bg, #863bff accent) + a simple "N".
 *
 * Run: node scripts/generate-icons.mjs
 * Then you can delete this script (it's a dev tool, not app code).
 *
 * Why not just ship an SVG? Android wants PNG at 192+512 for the install
 * prompt; iOS wants a 180px PNG for the home screen. SVG icons don't
 * reliably work as PWA icons in those sizes today.
 */
import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BG = { r: 26, g: 26, b: 26 }        // #1a1a1a — app background
const ACCENT = { r: 134, g: 59, b: 255 }  // #863bff — NEXUS purple
const FG = { r: 255, g: 255, b: 255 }     // white — the "N"

/**
 * Draw one icon. We rasterize two overlapping shapes by hand:
 *   - a filled square background
 *   - a bold "N" drawn as two vertical strokes + a diagonal (thick lines)
 * Then mask the corners to rounded-square for a modern app-icon look.
 *
 * This is intentionally simple — it's a placeholder that matches the brand
 * palette, not a design masterpiece.
 */
function drawIcon(size) {
  const png = new PNG({ width: size, height: size })
  const stroke = Math.max(3, Math.floor(size * 0.14)) // N leg thickness
  const inset = Math.floor(size * 0.26)               // N inset from edge
  const radius = Math.floor(size * 0.18)              // corner rounding

  const inBounds = (x, y) => {
    const cx = x - size / 2, cy = y - size / 2
    const hx = size / 2 - radius, hy = size / 2 - radius
    if (Math.abs(cx) <= hx || Math.abs(cy) <= hy) return true
    const dx = Math.abs(cx) - hx, dy = Math.abs(cy) - hy
    return dx <= 0 && dy <= 0 ? true : (dx * dx + dy * dy) <= radius * radius
  }

  const inN = (x, y) => {
    // Left leg: x in [inset, inset+stroke], full height
    if (x >= inset && x <= inset + stroke) return true
    // Right leg: x in [size-inset-stroke, size-inset], full height
    if (x >= size - inset - stroke && x <= size - inset) return true
    // Diagonal stroke: line from (inset,size-inset) to (size-inset,inset),
    // thickened by rotating the point into the line's frame. We test with a
    // distance-to-segment check instead (cheaper + clearer).
    const ax = inset, ay = size - inset
    const bx = size - inset, by = inset
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy
    let t = ((x - ax) * dx + (y - ay) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const px = ax + t * dx, py = ay + t * dy
    const dist2 = (x - px) * (x - px) + (y - py) * (y - py)
    return dist2 <= (stroke / 2) * (stroke / 2)
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2
      if (!inBounds(x, y)) {
        png.data[i] = 0; png.data[i + 1] = 0; png.data[i + 2] = 0; png.data[i + 3] = 0
        continue
      }
      // Slight gradient: a soft accent glow behind the N.
      const gx = x / size, gy = y / size
      const glow = 0.06 - 0.10 * ((gx - 0.5) * (gx - 0.5) + (gy - 0.5) * (gy - 0.5))
      const c = inN(x, y) ? FG : { r: BG.r + ACCENT.r * glow, g: BG.g + ACCENT.g * glow, b: BG.b + ACCENT.b * glow }
      png.data[i] = c.r; png.data[i + 1] = c.g; png.data[i + 2] = c.b; png.data[i + 3] = 255
    }
  }
  return png
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  const png = drawIcon(size)
  writeFileSync(join(outDir, name), PNG.sync.write(png))
  console.log(`wrote ${name} (${size}x${size})`)
}