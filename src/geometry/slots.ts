import * as THREE from 'three'

import { BEAD } from '../config'

/**
 * Ergebnis der Slot-Berechnung für eine Rille. Perlengröße und Rillenbreite
 * werden aus der Kurvenlänge abgeleitet — dadurch passen die gewünschten
 * `beadCount` Perlen immer exakt in die Rille, egal wie man die Maße in
 * `config.ts` verändert.
 */
export interface SlotLayout {
  /** Slot-Mittelpunkte in Shape-Koordinaten, in Reihenfolge entlang der Kurve. */
  positions: THREE.Vector2[]
  beadRadius: number
  channelHalfWidth: number
}

export function computeSlots(
  curve: THREE.Curve<THREE.Vector2>,
  count: number,
  closed: boolean,
): SlotLayout {
  const spacing = curve.getLength() / count
  const beadRadius = (spacing / 2) * BEAD.fillFactor

  const positions: THREE.Vector2[] = []
  for (let i = 0; i < count; i++) {
    // Offene Kurve: erste Perle einen halben Abstand vom Rillenende entfernt,
    // damit vorne und hinten gleich viel Luft bleibt.
    // Geschlossene Kurve: gleichmäßig verteilt, ohne Dopplung an der Naht.
    const u = closed ? i / count : (i + 0.5) / count
    positions.push(curve.getPointAt(u))
  }

  return {
    positions,
    beadRadius,
    channelHalfWidth: beadRadius * BEAD.channelClearance,
  }
}
