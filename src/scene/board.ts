import * as THREE from 'three'

import { BOARD, BRACELET_CHANNEL, COLORS, LIUZHU_CHANNEL, MALA_CHANNEL, type LoopSpec } from '../config'
import {
  circleOutline,
  createBoardOutline,
  createBraceletCenterline,
  createLoopCenterline,
  ribbonOutline,
} from '../geometry/channels'
import { computeSlots, type SlotLayout } from '../geometry/slots'
import { createOliveWoodTextures } from './woodTexture'
import type { ChannelDefinition, ChannelId } from '../state/malaState'

export interface Board {
  /** Enthält Brett, Rillenböden und die Perlen — um -90° um X gedreht. */
  group: THREE.Group
  channels: ChannelDefinition[]
  /** Rillenböden; gleichzeitig die Klickflächen (userData.channelId). */
  pickTargets: THREE.Mesh[]
  /** Höhe des Rillenbodens in Group-lokalen Koordinaten (= Extrusionsachse). */
  grooveFloorHeight: number
}

/** Eine fertig vermessene Rille, bevor sie zu Geometrie wird. */
interface ChannelBuild {
  id: ChannelId
  label: string
  slots: SlotLayout
  /** Umriss, der als Loch aus der oberen Platte gestanzt wird. */
  outline: THREE.Vector2[]
  /**
   * Nur bei geschlossenen Ringen: Die Fläche in der Mitte. Sie wird vom Loch
   * mit ausgestanzt und muss als eigene Scheibe wieder eingesetzt werden.
   */
  island?: THREE.Vector2[]
}

/**
 * Baut das Brett aus zwei übereinanderliegenden Extrusionen: einer Bodenplatte
 * und einer oberen Platte, aus der die Rillen als Löcher ausgestanzt sind. Die
 * Bodenplatte bildet damit den Rillenboden — echte Vertiefungen mit sichtbaren
 * Seitenwänden, ganz ohne CSG.
 *
 * Drei konzentrische Rillen: außen die Mala (108), darin das Liu Zhu (81) und
 * in der Mitte der Ring fürs Armband (27).
 */
export function createBoard(): Board {
  const baseHeight = BOARD.thickness - BOARD.grooveDepth
  const builds = [
    buildLoop('mala', 'Mala', MALA_CHANNEL, MALA_CHANNEL.beadCount),
    buildLoop('liuzhu', 'Liu Zhu', LIUZHU_CHANNEL, LIUZHU_CHANNEL.beadCount),
    buildRing(),
  ]

  const wood = createOliveWoodTextures()
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.board,
    map: wood.map,
    roughnessMap: wood.roughnessMap,
    roughness: 1.0,
    metalness: 0.0,
  })

  // Untere Platte: voller Brettumriss, bildet den Rillenboden.
  const baseGeometry = new THREE.ExtrudeGeometry(createBoardOutline(), {
    depth: baseHeight,
    bevelEnabled: false,
    curveSegments: 24,
  })

  // Obere Platte: gleicher Umriss, aber mit den Rillen als Löchern.
  const topShape = createBoardOutline()
  topShape.holes.push(...builds.map((build) => new THREE.Path(build.outline)))
  const topGeometry = new THREE.ExtrudeGeometry(topShape, {
    depth: BOARD.grooveDepth,
    bevelEnabled: false,
    curveSegments: 24,
  })
  topGeometry.translate(0, 0, baseHeight)

  const group = new THREE.Group()
  // Erst das Brett in seiner eigenen Ebene drehen (z), dann die Shape-Ebene
  // (x/y) in die Welt-Grundfläche (x/z) kippen — die Extrusion zeigt danach
  // nach oben. Die Reihenfolge stimmt so: Object3D wendet Euler-XYZ als
  // Rx · Ry · Rz an, die z-Drehung wirkt also noch in Shape-Koordinaten.
  group.rotation.set(-Math.PI / 2, 0, THREE.MathUtils.degToRad(BOARD.rotationDeg))
  group.add(new THREE.Mesh(baseGeometry, boardMaterial), new THREE.Mesh(topGeometry, boardMaterial))

  const pickTargets: THREE.Mesh[] = []
  for (const build of builds) {
    if (build.island) {
      const islandGeometry = new THREE.ExtrudeGeometry(new THREE.Shape(build.island), {
        depth: BOARD.grooveDepth,
        bevelEnabled: false,
      })
      islandGeometry.translate(0, 0, baseHeight)
      group.add(new THREE.Mesh(islandGeometry, boardMaterial))
    }

    const shape = new THREE.Shape(build.outline)
    if (build.island) shape.holes.push(new THREE.Path(build.island))

    const floor = createFloorMesh(shape, build.id, baseHeight)
    pickTargets.push(floor)
    group.add(floor)
  }

  return {
    group,
    channels: builds.map((build) => ({ id: build.id, label: build.label, ...build.slots })),
    pickTargets,
    grooveFloorHeight: baseHeight,
  }
}

function buildLoop(id: ChannelId, label: string, spec: LoopSpec, beadCount: number): ChannelBuild {
  const curve = createLoopCenterline(spec)
  const slots = computeSlots(curve, beadCount, false)

  return { id, label, slots, outline: ribbonOutline(curve, slots.channelHalfWidth) }
}

function buildRing(): ChannelBuild {
  const { centerX, centerY, radius, beadCount } = BRACELET_CHANNEL
  const curve = createBraceletCenterline()
  const slots = computeSlots(curve, beadCount, true)

  return {
    id: 'bracelet',
    label: 'Armband',
    slots,
    outline: circleOutline(centerX, centerY, radius + slots.channelHalfWidth),
    island: circleOutline(centerX, centerY, radius - slots.channelHalfWidth),
  }
}

/**
 * Dünne Fläche direkt auf dem Rillenboden. Sie färbt die Rille etwas dunkler
 * ein und dient zugleich als Klickfläche — dadurch trifft ein Klick exakt die
 * Rille und nie das Brett daneben.
 */
function createFloorMesh(shape: THREE.Shape, channelId: ChannelId, baseHeight: number): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(shape, 24)
  geometry.translate(0, 0, baseHeight + 0.004)

  // Dieselbe Holztextur, nur abgetönt — die Maserung läuft dadurch ohne Bruch
  // von der Brettoberfläche in die Rille hinein.
  const wood = createOliveWoodTextures()
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: COLORS.grooveFloor,
      map: wood.map,
      roughnessMap: wood.roughnessMap,
      roughness: 1.0,
      metalness: 0.0,
    }),
  )
  mesh.userData['channelId'] = channelId
  mesh.name = `groove-floor-${channelId}`

  return mesh
}
