import * as THREE from 'three'

import { BOARD, BRACELET_CHANNEL, TESSELLATION, type LoopSpec } from '../config'

/**
 * Mittellinie einer offenen Schlaufe: Stadionform, unten offen.
 *
 * Gerade senkrechte Seiten, oben ein sehr großzügiger Bogen, unten schwenken
 * die beiden Enden zur Öffnung ein — so liegt die Kette auf dem echten Board.
 *
 * Der Pfad startet am linken Rand der Öffnung, läuft über die Oberkante und
 * endet am rechten Rand — die Kette wächst also von unten links nach unten
 * rechts, genau wie man sie auslegt.
 */
export function createLoopCenterline(spec: LoopSpec): THREE.Curve<THREE.Vector2> {
  const { halfWidth: hw, halfHeight: hh, topRadius: rt, bottomRadius: rb, openingWidth } = spec
  const halfOpening = openingWidth / 2

  const path = new THREE.Path()
  path.moveTo(-halfOpening, -hh)
  // Erste Gerade explizit — absarc() ergänzt die Verbindungslinie nur, wenn
  // bereits eine Kurve im Pfad liegt; nach moveTo() ist der Pfad noch leer.
  path.lineTo(-hw + rb, -hh)
  path.absarc(-hw + rb, -hh + rb, rb, -Math.PI / 2, -Math.PI, true) // unten links
  path.absarc(-hw + rt, hh - rt, rt, Math.PI, Math.PI / 2, true) // oben links
  path.absarc(hw - rt, hh - rt, rt, Math.PI / 2, 0, true) // oben rechts
  path.absarc(hw - rb, -hh + rb, rb, 0, -Math.PI / 2, true) // unten rechts
  path.lineTo(halfOpening, -hh)

  return path
}

/** Mittellinie der O-Rille: geschlossener Kreis. */
export function createBraceletCenterline(): THREE.Path {
  const { centerX, centerY, radius } = BRACELET_CHANNEL

  const path = new THREE.Path()
  path.absarc(centerX, centerY, radius, 0, Math.PI * 2, false)

  return path
}

/** Abgerundetes Rechteck als Brettumriss. */
export function createBoardOutline(): THREE.Shape {
  const hw = BOARD.width / 2
  const hh = BOARD.height / 2
  const r = BOARD.cornerRadius

  const shape = new THREE.Shape()
  shape.moveTo(-hw + r, -hh)
  shape.lineTo(hw - r, -hh)
  shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(hw, hh - r)
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-hw + r, hh)
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-hw, -hh + r)
  shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false)

  return shape
}

/**
 * Verdickt eine offene Kurve zu einem geschlossenen Umriss: Offset um
 * ±halfWidth entlang der Kurvennormalen, mit halbkreisförmigen Endkappen.
 *
 * Genau dieser Umriss wird doppelt verwendet — als Loch in der oberen
 * Brettplatte (die sichtbare Rille) und als unsichtbare Klickfläche.
 */
export function ribbonOutline(
  curve: THREE.Curve<THREE.Vector2>,
  halfWidth: number,
  samples = TESSELLATION.malaOutlineSamples,
): THREE.Vector2[] {
  const points = curve.getSpacedPoints(samples)

  const left: THREE.Vector2[] = []
  const right: THREE.Vector2[] = []
  for (let i = 0; i <= samples; i++) {
    const p = points[i]
    if (!p) continue
    const tangent = curve.getTangentAt(i / samples)
    // Normale = Tangente um +90° gedreht.
    const nx = -tangent.y * halfWidth
    const ny = tangent.x * halfWidth
    left.push(new THREE.Vector2(p.x + nx, p.y + ny))
    right.push(new THREE.Vector2(p.x - nx, p.y - ny))
  }

  const first = points[0]
  const last = points[points.length - 1]
  const leftEnd = left[left.length - 1]
  const rightStart = right[0]
  if (!first || !last || !leftEnd || !rightStart) {
    throw new Error('ribbonOutline: Kurve lieferte keine Punkte')
  }

  return [
    ...left,
    // Endkappe: von der linken auf die rechte Seite, über die Spitze hinweg.
    ...halfCircle(last, leftEnd),
    ...right.slice().reverse(),
    // Startkappe: zurück von rechts nach links.
    ...halfCircle(first, rightStart),
  ]
}

/**
 * Halbkreis um `center`, beginnend bei `from` und im Uhrzeigersinn um PI
 * gedreht. Start- und Endpunkt selbst werden ausgelassen, die liefern bereits
 * die angrenzenden Seitenlinien.
 */
function halfCircle(center: THREE.Vector2, from: THREE.Vector2): THREE.Vector2[] {
  const segments = TESSELLATION.capSegments
  const radius = from.distanceTo(center)
  const startAngle = Math.atan2(from.y - center.y, from.x - center.x)

  const arc: THREE.Vector2[] = []
  for (let i = 1; i < segments; i++) {
    const angle = startAngle - (Math.PI * i) / segments
    arc.push(
      new THREE.Vector2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius),
    )
  }

  return arc
}

/** Kreis-Umriss als Punktliste — für Loch und Insel der O-Rille. */
export function circleOutline(
  centerX: number,
  centerY: number,
  radius: number,
  segments = TESSELLATION.braceletOutlineSegments,
): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push(
      new THREE.Vector2(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius),
    )
  }

  return points
}
