import * as THREE from 'three'

import {
  clamp01,
  hashSeed,
  hexToRgb,
  makeFbm,
  makeNoise,
  mix,
  paintCanvas,
  ridge,
  smoothstep,
  type Rgb,
} from '../textures/noise'
import { getStone, type StoneDefinition, type StonePattern } from './catalog'

const TEXTURE_SIZE = 256

const canvases = new Map<string, HTMLCanvasElement>()
const textures = new Map<string, THREE.CanvasTexture>()

/** Textur für die Perlenoberfläche. Wird pro Stein einmal erzeugt und gecacht. */
export function getStoneTexture(stoneId: string): THREE.CanvasTexture {
  const cached = textures.get(stoneId)
  if (cached) return cached

  const texture = new THREE.CanvasTexture(getStoneCanvas(stoneId))
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  textures.set(stoneId, texture)

  return texture
}

/** Dasselbe Bild als Canvas — die Auswahl-Kacheln zeichnen es verkleinert nach. */
export function getStoneCanvas(stoneId: string): HTMLCanvasElement {
  const cached = canvases.get(stoneId)
  if (cached) return cached

  const canvas = renderStone(getStone(stoneId))
  canvases.set(stoneId, canvas)

  return canvas
}

// ---------------------------------------------------------------------------
// Muster
// ---------------------------------------------------------------------------

type Painter = (u: number, v: number) => Rgb

function makePainter(stone: StoneDefinition): Painter {
  const seed = hashSeed(stone.id)
  const base = hexToRgb(stone.palette.base)
  const secondary = hexToRgb(stone.palette.secondary)
  const accent = stone.palette.accent ? hexToRgb(stone.palette.accent) : null
  const { contrast } = stone

  const painters: Record<StonePattern, () => Painter> = {
    solid: () => {
      // Feines Korn über einer breiten Aufhellung — ohne die zweite Ebene
      // wirken einfarbige Steine wie lackierte Plastikkugeln.
      const grain = makeFbm(seed, 5, 8, 8)
      const broad = makeFbm(seed + 37, 2, 2, 2)
      return (u, v) => {
        const t = grain(u, v) * 0.55 + broad(u, v) * 0.45
        return mix(base, secondary, smoothstep(0.24, 0.86, t) * contrast * 0.9)
      }
    },

    mottled: () => {
      const clouds = makeFbm(seed, 5, 3, 3)
      const patches = makeFbm(seed + 101, 4, 4, 4)
      return (u, v) => {
        const t = smoothstep(0.5 - 0.3 * contrast, 0.5 + 0.3 * contrast, clouds(u, v))
        const color = mix(base, secondary, t)
        if (!accent) return color
        const p = patches(u, v)
        return p > 0.66 ? mix(color, accent, smoothstep(0.66, 0.84, p) * contrast) : color
      }
    },

    banded: () => {
      const warp = makeFbm(seed, 4, 4, 4)
      return (u, v) => {
        // u * 2 hält die Bänder über die Naht hinweg stetig.
        const phase = (v * 5 + u * 2 + warp(u, v) * 0.9) * Math.PI * 2
        const wave = 0.5 + 0.5 * Math.sin(phase)
        const t = smoothstep(0.5 - 0.35 * contrast, 0.5 + 0.35 * contrast, wave)
        const color = mix(base, secondary, t)
        if (!accent) return color
        // Schmale dunkle Trennlinie am Bandrand.
        const edge = smoothstep(0.93, 1.0, Math.abs(Math.sin(phase * 0.5)))
        return mix(color, accent, edge * contrast * 0.8)
      }
    },

    speckled: () => {
      const ground = makeFbm(seed, 4, 5, 5)
      const dots = makeNoise(seed + 313, 22, 22)
      const fine = makeNoise(seed + 977, 70, 70)
      return (u, v) => {
        const color = mix(base, secondary, ground(u, v) * 0.9)
        if (!accent) return color
        const blob = smoothstep(0.66, 0.74, dots(u, v))
        const fleck = smoothstep(0.78, 0.86, fine(u, v))
        return mix(color, accent, Math.max(blob, fleck * 0.8) * contrast)
      }
    },

    dendritic: () => {
      const ground = makeFbm(seed, 4, 5, 5)
      const branches = makeFbm(seed + 555, 5, 5, 5)
      const cluster = makeFbm(seed + 1201, 2, 2, 2)
      return (u, v) => {
        const color = mix(base, secondary, ground(u, v) * 0.8)
        if (!accent) return color
        // Äste wachsen nur dort, wo die grobe Maske sie zulässt — echte
        // Baum-/Moosachate haben inklusionsfreie Zonen.
        const mask = smoothstep(0.42, 0.62, cluster(u, v))
        const filament = smoothstep(0.80, 0.94, ridge(branches(u, v)))
        return mix(color, accent, filament * mask * contrast)
      }
    },

    veined: () => {
      const ground = makeFbm(seed, 4, 4, 4)
      const veins = makeFbm(seed + 733, 4, 3, 3)
      return (u, v) => {
        const color = mix(base, secondary, ground(u, v) * 0.85)
        if (!accent) return color
        const vein = smoothstep(0.90, 0.985, ridge(veins(u, v)))
        return mix(color, accent, vein * contrast)
      }
    },

    chatoyant: () => {
      // Das Rauschen ist quer gestreckt (schmales x-Gitter, feines y-Gitter):
      // daraus werden unregelmäßige Fasern statt gleichmäßiger Streifen. Ein
      // periodisches Muster über u würde an den Polen sternförmig zusammen-
      // laufen und die Perle wie einen Wasserball aussehen lassen.
      const fibres = makeFbm(seed, 3, 3, 26)
      const drift = makeFbm(seed + 89, 2, 5, 5)
      return (u, v) => {
        const f = fibres(u, clamp01(v + (drift(u, v) - 0.5) * 0.05))
        const color = mix(base, secondary, smoothstep(0.34, 0.74, f) * contrast)
        if (!accent) return color
        // Der Lichtstreifen quer zur Faser — der eigentliche Katzenaugen-Effekt.
        const sheen = Math.exp(-((v - 0.40) ** 2) / 0.011)
        return mix(color, accent, sheen * contrast * 0.8)
      }
    },

    crackled: () => {
      const body = makeFbm(seed, 3, 5, 5)
      // Wenige Oktaven halten die Bruchlinien kantig statt wolkig; zwei
      // Ebenen in verschiedenen Größen ergeben das Splitternetz.
      const coarse = makeFbm(seed + 421, 2, 5, 5)
      const fine = makeFbm(seed + 8123, 2, 11, 11)
      return (u, v) => {
        const color = mix(base, secondary, body(u, v) * 0.6)
        if (!accent) return color
        const crack = Math.max(
          smoothstep(0.80, 0.97, ridge(coarse(u, v))),
          smoothstep(0.88, 0.99, ridge(fine(u, v))) * 0.7,
        )
        return mix(color, accent, crack * contrast)
      }
    },

    porous: () => {
      const pores = makeFbm(seed, 3, 14, 14)
      return (u, v) => {
        const n = pores(u, v)
        // Heller Rand um jedes Loch, dann der dunkle Grund.
        const rim = accent ? smoothstep(0.52, 0.44, n) - smoothstep(0.44, 0.38, n) : 0
        const hole = smoothstep(0.46, 0.36, n)
        const color = mix(base, secondary, hole * contrast)
        return accent ? mix(color, accent, rim * 0.6) : color
      }
    },

    druzy: () => {
      const ground = makeFbm(seed, 4, 5, 5)
      const crystals = makeNoise(seed + 2027, 56, 56)
      return (u, v) => {
        const color = mix(base, secondary, ground(u, v) * 0.8)
        if (!accent) return color
        const sparkle = smoothstep(0.74, 0.82, crystals(u, v))
        return mix(color, accent, sparkle * contrast)
      }
    },
  }

  return painters[stone.pattern]()
}

function renderStone(stone: StoneDefinition): HTMLCanvasElement {
  return paintCanvas(TEXTURE_SIZE, makePainter(stone))
}
