import type { BeadLayer } from '../scene/beads'
import type { Board } from '../scene/board'
import type { Bead, ChannelId, MalaState } from '../state/malaState'

/**
 * Bündelt alle Perlen-Aktionen und hält dabei Zustand und Szene im Gleichschritt.
 * Maus-Steuerung und HUD greifen auf dieselbe Stelle zu, statt das Nachziehen
 * der Meshes jeweils selbst zu erledigen.
 */
export interface BeadActions {
  /** Setzt eine Perle an den nächsten freien Slot der Rille. */
  place(channelId: ChannelId, stoneId: string): void
  remove(beadId: number): void
  undo(): void
  clear(): void
}

export function createBeadActions(
  state: MalaState,
  board: Board,
  beads: BeadLayer,
): BeadActions {
  const render = (bead: Bead): void => {
    const channel = state.getChannel(bead.channelId)
    beads.add(
      bead,
      state.slotPosition(bead.channelId, bead.slotIndex),
      channel.beadRadius,
      board.grooveFloorHeight,
    )
  }

  return {
    place(channelId, stoneId) {
      const bead = state.addBead(channelId, stoneId)
      if (bead) render(bead)
    },

    remove(beadId) {
      if (state.removeBead(beadId)) beads.remove(beadId)
    },

    undo() {
      const result = state.undo()
      if (!result) return
      for (const bead of result.removed) beads.remove(bead.id)
      for (const bead of result.restored) render(bead)
    },

    clear() {
      for (const bead of state.clear()) beads.remove(bead.id)
    },
  }
}
