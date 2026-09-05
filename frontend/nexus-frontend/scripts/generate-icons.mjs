/**
 * generate-icons.mjs — one-off PWA icon generator.
 *
 * Creates public/icons/{icon-192,icon-512,apple-touch-icon}.png from the
 * CUE brand palette (#1a1a1a bg) + the CUE "ping" mark.
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
const FG = { r: 255, g: 255, b: 255 } // white — the ping mark

/**
 * Is a normalized point (u, v) in [0,1]² inside the CUE "ping" mark?
 *
 * The mark is a radar / sonar pulse: a bright source dot in the center with
 * concentric arcs radiating outward — "your cue has arrived." It's a signal,
 * not a bell. Geometry (see sketch at the bottom):
 *   1. source — a filled circle at the center
 *   2. arcs   — three concentric rings radiating outward
 *   3. sweep  — a wedge left open at the bottom so the rings read as a live
 *               radar sweep, not static closed rings
 */
function inPing(u, v) {
  const cx = 0.5, cy = 0.5
  const dx = u - cx, dy = v - cy
  const dist = Math.hypot(dx, dy)

  // Angle of this point around the source. Screen y grows downward, so the
  // "bottom" (+dy direction) is angle π/2 — that's where the sweep gap sits.
  const angle = Math.atan2(dy, dx)

  // Wrap (angle - π/2) into [-π, π] so |·| is the true angular distance.
  let diff = angle - Math.PI / 2
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI

  // The sweep gap: a ~57° wedge (half-width 0.5 rad) left open at the bottom.
  const gapHalf = 0.5
  const inGap = Math.abs(diff) < gapHalf

  // 1. Source — a filled center dot (always full, never interrupted by the gap).
  if (dist <= 0.06) return true

  // 2. Arcs — three concentric rings radiating outward, skipping the gap.
  const arcs = [
    { r: 0.15, t: 0.032 },
    { r: 0.27, t: 0.032 },
    { r: 0.39, t: 0.032 },
  ]
  for (const { r, t } of arcs) {
    if (!inGap && Math.abs(dist - r) <= t / 2) return true
  }
  return false
}

/**
 * Draw one icon.
 * Rasterize the ping mark (white) onto a #1a1a1a background, rounded corners.
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
      const c = inPing(x / size, y / size) ? FG : BG
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
 * CUE "ping" geometry reference:
 *
 *              __________
 *            /            \     <- outer arc (r=0.39)
 *           |              |
 *         _/      __      \_
 *        /      _/  \_      \   <- middle arc (r=0.27)
 *       |     _/      \_    |
 *       |   _/    •    \_   |   <- inner arc (r=0.15) + source dot
 *        \_/              \_/
 *          \______________/     <- gap open at the bottom (radar sweep)
 *
 * A source dot with rings radiating outward, like a sonar ping sent out
 * when it's time — the cue has arrived.
 */
