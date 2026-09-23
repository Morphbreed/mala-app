import * as THREE from 'three'

import { WOOD } from '../config'
import {
  clamp01,
  hashSeed,
  hexToRgb,
  makeFbm,
  mix,
  paintCanvas,
  ridge,
  smoothstep,
} from '../textures/noise'

export interface WoodTextures {
  map: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

let cached: WoodTextures | null = null

/**
 * Olivenholz-Maserung als kachelbare Textur.
 *
 * Extrude- und ShapeGeometry legen die UV-Koordinaten in Brett-Einheiten an,
 * nicht normiert auf 0–1. Über `repeat` lässt sich die Maserung deshalb direkt
 * in Zentimetern skalieren, und Brettoberfläche und Rillenböden bekommen
 * automatisch dieselbe durchgehende Maserung.
 */
export function createOliveWoodTextures(): WoodTextures {
  if (cached) return cached

  const seed = hashSeed('olivenholz')
  const light = hexToRgb(WOOD.light)
  const mid = hexToRgb(WOOD.mid)
  const dark = hexToRgb(WOOD.dark)
  const deep = hexToRgb(WOOD.deep)

  // Großflächiger Wirbel. Er verzerrt die Maserlinien und macht aus geraden
  // Streifen die typisch wilde Olivenholz-Zeichnung.
  const flow = makeFbm(seed, 4, 3, 2, true)
  // Die Maserlinien selbst: dicht in u, langgezogen in v — sie laufen also
  // längs des Bretts.
  const grain = makeFbm(seed + 1301, 5, 16, 3, true)
  // Breite Hell-Dunkel-Zonen, wie sie zwischen den Jahresringen liegen.
  const zones = makeFbm(seed + 4409, 3, 4, 2, true)
  // Feines Korn gegen den Plastikeindruck.
  const fibre = makeFbm(seed + 8821, 3, 40, 12, true)

  // Beide Karten entstehen aus demselben Maserwert, damit die dunklen Adern
  // auch matter sind — sonst wirkt die Maserung wie aufgedruckt.
  const grainAt = (u: number, v: number): number => {
    const warp = (flow(u, v) - 0.5) * WOOD.flow
    return ridge(grain(u + warp, v + warp * 0.35))
  }

  const map = new THREE.CanvasTexture(
    paintCanvas(WOOD.resolution, (u, v) => {
      // Die weichen Hell-Dunkel-Zonen bleiben immer voll erhalten — sie sind
      // ruhig und tragen den Holzeindruck.
      const zone = mix(light, mid, smoothstep(0.30, 0.80, zones(u, v)))

      // Die scharfe Maserung obendrauf. Schwellen bewusst hoch, damit die
      // dunklen Adern Akzent bleiben statt die Fläche zu dominieren.
      const grain = grainAt(u, v)
      const veined = mix(zone, dark, smoothstep(0.70, 0.95, grain))
      const lined = mix(veined, deep, smoothstep(0.94, 0.999, grain))
      const full = mix(lined, light, clamp01(fibre(u, v) - 0.5) * 0.22)

      // Nur die Maserung wird zurückgenommen, nicht der Grundton.
      return mix(zone, full, WOOD.contrast)
    }),
  )
  map.colorSpace = THREE.SRGBColorSpace

  const roughnessMap = new THREE.CanvasTexture(
    paintCanvas(WOOD.resolution, (u, v) => {
      const value = 160 + smoothstep(0.60, 0.95, grainAt(u, v)) * 70 * WOOD.contrast
      return [value, value, value]
    }),
  )

  for (const texture of [map, roughnessMap]) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // UVs kommen in Brett-Einheiten herein, also 1/tileSize pro Einheit.
    texture.repeat.set(1 / WOOD.tileSize, 1 / WOOD.tileSize)
    texture.anisotropy = 8
  }

  cached = { map, roughnessMap }
  return cached
}
