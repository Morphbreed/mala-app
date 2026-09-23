import * as THREE from 'three'

import type { Board } from '../scene/board'
import type { BeadLayer } from '../scene/beads'
import type { ChannelId, MalaState } from '../state/malaState'
import type { BeadActions } from './beadActions'
import { registerShortcut } from '../ui/shortcuts'
import type { StonePicker } from '../ui/stonePicker'

/** Bis zu dieser Pixel-Distanz gilt ein Pointer-Down/Up noch als Klick. */
const CLICK_TOLERANCE_PX = 5

export interface PickingContext {
  canvas: HTMLCanvasElement
  camera: THREE.Camera
  state: MalaState
  board: Board
  beads: BeadLayer
  actions: BeadActions
  /** Liefert die gerade gewählte Steinsorte für die nächste Perle. */
  picker: StonePicker
}

/**
 * Verdrahtet Maus und Tastatur mit dem Zustand:
 * Linksklick setzt die nächste Perle in die getroffene Rille, Rechtsklick
 * entfernt eine Perle, Strg/Cmd+Z nimmt die zuletzt gesetzte zurück.
 */
export function setupPicking({
  canvas,
  camera,
  state,
  board,
  beads,
  actions,
  picker,
}: PickingContext): void {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let downX = 0
  let downY = 0
  let downButton = -1
  /** Rille unter dem Cursor, damit die Vorschau auch ohne Mausbewegung stimmt. */
  let hoveredChannel: ChannelId | null = null

  const pickChannel = (event: PointerEvent | MouseEvent): ChannelId | null => {
    updatePointer(event, canvas, pointer)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(board.pickTargets, false)[0]
    const channelId = hit?.object.userData['channelId']
    return typeof channelId === 'string' ? (channelId as ChannelId) : null
  }

  const pickBeadId = (event: PointerEvent | MouseEvent): number | null => {
    updatePointer(event, canvas, pointer)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(beads.pickTargets, false)[0]
    const beadId = hit?.object.userData['beadId']
    return typeof beadId === 'number' ? beadId : null
  }

  canvas.addEventListener('pointerdown', (event) => {
    downX = event.clientX
    downY = event.clientY
    downButton = event.button
  })

  canvas.addEventListener('pointerup', (event) => {
    const isClick =
      event.button === downButton &&
      Math.abs(event.clientX - downX) <= CLICK_TOLERANCE_PX &&
      Math.abs(event.clientY - downY) <= CLICK_TOLERANCE_PX
    downButton = -1
    if (!isClick) return // War ein Kamera-Drag, keine Perlen-Aktion.

    if (event.button === 0) {
      const channelId = pickChannel(event)
      if (channelId) actions.place(channelId, picker.getSelectedId())
      updateGhost(event)
    } else if (event.button === 2) {
      const beadId = pickBeadId(event)
      if (beadId !== null) actions.remove(beadId)
      updateGhost(event)
    }
  })

  canvas.addEventListener('pointercancel', () => {
    downButton = -1
  })

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault()
  })

  /**
   * Zeichnet die Vorschau-Perle neu. Bewusst getrennt von der Mausbewegung:
   * auch ein Steinwechsel per Zifferntaste oder ein Undo muss die Vorschau
   * unter dem stehenden Cursor aktualisieren — sonst sieht es aus, als hätte
   * der Wechsel nicht gegriffen.
   */
  const refreshGhost = (): void => {
    const slotIndex = hoveredChannel === null ? null : state.nextFreeSlot(hoveredChannel)
    if (hoveredChannel === null || slotIndex === null) {
      beads.hideGhost()
      canvas.style.cursor = 'default'
      return
    }

    const channel = state.getChannel(hoveredChannel)
    beads.showGhost(
      picker.getSelectedId(),
      state.slotPosition(hoveredChannel, slotIndex),
      channel.beadRadius,
      board.grooveFloorHeight,
    )
    canvas.style.cursor = 'pointer'
  }

  const updateGhost = (event: PointerEvent | MouseEvent): void => {
    hoveredChannel = pickChannel(event)
    refreshGhost()
  }

  picker.onChange(refreshGhost)
  state.onChange(refreshGhost)

  canvas.addEventListener('pointermove', (event) => {
    // Während eines Drags nicht flackern lassen.
    if (downButton !== -1) return
    updateGhost(event)
  })

  canvas.addEventListener('pointerleave', () => {
    hoveredChannel = null
    refreshGhost()
  })

  registerShortcut((event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return false

    event.preventDefault()
    actions.undo()
    return true
  })
}

function updatePointer(
  event: PointerEvent | MouseEvent,
  canvas: HTMLCanvasElement,
  target: THREE.Vector2,
): void {
  const rect = canvas.getBoundingClientRect()
  target.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )
}
