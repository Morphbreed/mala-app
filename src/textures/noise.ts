/**
 * Gemeinsame Bausteine für alle prozeduralen Texturen — Steine wie Holz.
 */

export type NoiseFn = (x: number, y: number) => number
export type Rgb = [number, number, number]

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Wertrauschen auf einem Gitter.
 *
 * In x läuft es immer nahtlos um — die Kugel-UV wickelt dort herum, sonst zöge
 * sich eine sichtbare Naht über jede Perle. Mit `wrapY` läuft es auch senkrecht
 * um, was Texturen ergibt, die sich in beide Richtungen kacheln lassen.
 *
 * Koordinaten außerhalb von [0,1) sind erlaubt und werden mitgefaltet — dadurch
 * bleiben auch verzerrte Abtastungen nahtlos.
 */
export function makeNoise(seed: number, gridX: number, gridY: number, wrapY = false): NoiseFn {
  const random = mulberry32(seed)
  const grid = new Float32Array(gridX * gridY)
  for (let i = 0; i < grid.length; i++) grid[i] = random()

  const at = (ix: number, iy: number): number => {
    const x = ((ix % gridX) + gridX) % gridX
    const y = wrapY ? ((iy % gridY) + gridY) % gridY : Math.min(Math.max(iy, 0), gridY - 1)
    return grid[y * gridX + x] ?? 0
  }

  return (x, y) => {
    const fx = x * gridX
    const fy = y * gridY
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = smoothstepUnit(fx - x0)
    const ty = smoothstepUnit(fy - y0)

    const top = lerp(at(x0, y0), at(x0 + 1, y0), tx)
    const bottom = lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx)
    return lerp(top, bottom, ty)
  }
}

/** Mehrere Rausch-Oktaven übereinander — gibt der Struktur Tiefe. */
export function makeFbm(
  seed: number,
  octaves: number,
  gridX: number,
  gridY: number,
  wrapY = false,
): NoiseFn {
  const layers: { noise: NoiseFn; amplitude: number }[] = []
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const amplitude = 0.5 ** o
    layers.push({ noise: makeNoise(seed + o * 7919, gridX << o, gridY << o, wrapY), amplitude })
    total += amplitude
  }

  return (x, y) => {
    let sum = 0
    for (const layer of layers) sum += layer.noise(x, y) * layer.amplitude
    return sum / total
  }
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = clamp01(t)
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export function smoothstepUnit(t: number): number {
  return t * t * (3 - 2 * t)
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 === edge0) return value < edge0 ? 0 : 1
  return smoothstepUnit(clamp01((value - edge0) / (edge1 - edge0)))
}

/** Grat-Rauschen: Werte um 0.5 werden zu 1 — daraus entstehen Adern und Maserung. */
export function ridge(value: number): number {
  return 1 - Math.abs(value * 2 - 1)
}

/** Malt Pixel für Pixel in ein Canvas. `paint` bekommt UV-Koordinaten in [0,1). */
export function paintCanvas(
  size: number,
  paint: (u: number, v: number) => Rgb,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D-Context nicht verfügbar')

  const image = context.createImageData(size, size)
  let offset = 0
  for (let y = 0; y < size; y++) {
    const v = y / size
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x / size, v)
      image.data[offset++] = r
      image.data[offset++] = g
      image.data[offset++] = b
      image.data[offset++] = 255
    }
  }
  context.putImageData(image, 0, 0)

  return canvas
}
