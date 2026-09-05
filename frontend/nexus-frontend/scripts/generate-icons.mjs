/**
 * generate-icons.mjs — one-off PWA icon generator.
 *
 * Creates public/icons/{icon-192,icon-512,apple-touch-icon}.png from the
 * CUE brand palette (#1a1a1a bg) + a simple white bell.
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

const BG = { r: 26, g: 26, b: 26 }    // #1a1a1a — app background
const FG = { r: 255, g: 255, b: 255 } // white — the bell

/**
 * Is a normalized point (u, v) in [0,1]² inside the bell?
 *
 * The bell is a union of simple shapes (see the doc comment at the bottom
 * for the geometry sketch):
 *   1. dome      — a circle for the rounded top
 *   2. skirt     — a flared trapezoid that widens toward the bottom
 *   3. lip       — a capsule (rounded bar) at the bottom rim
 *   4. clapper   — a tiny circle hanging below, on a thin stem
 */
function inBell(u, v) {
  // --- 1. Dome: circle centered at (0.50, 0.42), radius 0.26 ---
  const dome = (u - 0.5) ** 2 + (v - 0.42) ** 2 <= 0.26 ** 2

  // --- 2. Skirt: flared trapezoid, v in [0.42, 0.72],
  //        half-width grows 0.26 -> 0.34 ---
  const skirtT = 0.42, skirtB = 0.72, wT = 0.26, wB = 0.34
  const skirt = v >= skirtT && v <= skirtB
    && Math.abs(u - 0.5) <= wT + (wB - wT) * (v - skirtT) / (skirtB - skirtT)

  // --- 3. Lip: capsule centered at (0.5, 0.75), half-length 0.40,
  //        tube radius 0.055 ---
  const lipY = 0.75, lipHalf = 0.40, lipR = 0.055
  const lipClampX = Math.max(0.5 - lipHalf, Math.min(0.5 + lipHalf, u))
  const lip = (v - lipY) ** 2 + (u - lipClampX) ** 2 <= lipR ** 2

  // --- 4. Clapper + stem ---
  const clapR = 0.05
  const clapper = (u - 0.5) ** 2 + (v - 0.90) ** 2 <= clapR ** 2
  const stem = u >= 0.49 && u <= 0.51 && v >= 0.80 && v <= 0.865

  return dome || skirt || lip || clapper || stem
}

/**
 * Draw one icon.
 * Rasterize the bell (white) onto a #1a1a1a background, rounded corners.
 */
function drawIcon(size) {
  const png = new PNG({ width: size, height: size })
  const radius = Math.floor(size * 0.18) // corner rounding

  const inBounds = (x, y) => {
    const cx = x - size / 2, cy = y - size / 2
    const hx = size / 2 - radius, hy = size / 2 - radius
    if (Math.abs(cx) <= hx || Math.abs(cy) <= hy) return true
    const dx = Math.abs(cx) - hx, dy = Math.abs(cy) - hy
    return dx <= 0 && dy <= 0 ? true : (dx * dx + dy * dy) <= radius * radius
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2
      if (!inBounds(x, y)) {
        png.data[i] = 0; png.data[i + 1] = 0; png.data[i + 2] = 0; png.data[i + 3] = 0
        continue
      }
      const c = inBell(x / size, y / size) ? FG : BG
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

/*
 * Bell geometry reference:
 *
 *              dome (circle)
 *           .-----------.
 *          /             \
 *         |               |  skirt (flared
 *         |               |   trapezoid)
 *         \               /
 *          \_____________/   <- lip (capsule)
 *                |
 *               (o)          <- clapper
 */