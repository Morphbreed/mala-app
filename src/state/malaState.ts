import type * as THREE from 'three'

import type { SlotLayout } from '../geometry/slots'

export type ChannelId = 'mala' | 'liuzhu' | 'bracelet'

export interface ChannelDefinition extends SlotLayout {
  id: ChannelId
  label: string
}

export interface Bead {
  id: number
  channelId: ChannelId
  slotIndex: number
  /** Welcher Stein auf diesem Slot liegt — siehe `stones/catalog.ts`. */
  stoneId: string
}

/**
 * Eine rückgängig machbare Aktion. „Alles entfernen“ merkt sich die Perlen,
 * damit ein versehentlicher Klick nicht 108 gesetzte Perlen kostet.
 */
type HistoryEntry = { kind: 'place'; bead: Bead } | { kind: 'clear'; beads: Bead[] }

/** Was die Szene nach einem Undo nachziehen muss. */
export interface UndoResult {
  removed: Bead[]
  restored: Bead[]
}

/**
 * Hält, welche Slots belegt sind, und in welcher Reihenfolge die Perlen gesetzt
 * wurden. Bewusst frei von Szenen-Objekten: die Szene abonniert nur die
 * Änderungen und spiegelt sie in Meshes.
 */
export class MalaState {
  private readonly channels = new Map<ChannelId, ChannelDefinition>()
  private readonly occupancy = new Map<ChannelId, (Bead | null)[]>()
  /** Aktions-Reihenfolge über alle Rillen hinweg — Basis für Undo. */
  private readonly history: HistoryEntry[] = []
  private readonly listeners = new Set<() => void>()
  private nextBeadId = 1

  constructor(definitions: ChannelDefinition[]) {
    for (const definition of definitions) {
      this.channels.set(definition.id, definition)
      this.occupancy.set(definition.id, new Array<Bead | null>(definition.positions.length).fill(null))
    }
  }

  getChannel(channelId: ChannelId): ChannelDefinition {
    const channel = this.channels.get(channelId)
    if (!channel) throw new Error(`Unbekannte Rille: ${channelId}`)
    return channel
  }

  listChannels(): ChannelDefinition[] {
    return [...this.channels.values()]
  }

  slotPosition(channelId: ChannelId, slotIndex: number): THREE.Vector2 {
    const position = this.getChannel(channelId).positions[slotIndex]
    if (!position) throw new Error(`Slot ${slotIndex} existiert nicht in ${channelId}`)
    return position
  }

  /** Index des ersten freien Slots, oder null wenn die Rille voll ist. */
  nextFreeSlot(channelId: ChannelId): number | null {
    const slots = this.slotsOf(channelId)
    const index = slots.indexOf(null)
    return index === -1 ? null : index
  }

  /** Setzt eine Perle an den ersten freien Slot. Null, wenn die Rille voll ist. */
  addBead(channelId: ChannelId, stoneId: string): Bead | null {
    const slotIndex = this.nextFreeSlot(channelId)
    if (slotIndex === null) return null

    const bead: Bead = { id: this.nextBeadId++, channelId, slotIndex, stoneId }
    this.slotsOf(channelId)[slotIndex] = bead
    this.history.push({ kind: 'place', bead })
    this.emitChange()

    return bead
  }

  removeBead(beadId: number): Bead | null {
    const index = this.history.findIndex(
      (entry) => entry.kind === 'place' && entry.bead.id === beadId,
    )
    if (index === -1) return null

    const [entry] = this.history.splice(index, 1)
    if (entry?.kind !== 'place') return null

    this.slotsOf(entry.bead.channelId)[entry.bead.slotIndex] = null
    this.emitChange()

    return entry.bead
  }

  /** Nimmt alle Perlen vom Brett. Per Undo wiederherstellbar. */
  clear(): Bead[] {
    const cleared: Bead[] = []
    for (const slots of this.occupancy.values()) {
      for (let i = 0; i < slots.length; i++) {
        const bead = slots[i]
        if (!bead) continue
        cleared.push(bead)
        slots[i] = null
      }
    }
    if (cleared.length === 0) return []

    // Die einzelnen Setz-Aktionen sind jetzt gegenstandslos — sonst würde ein
    // zweites Undo eine Perle „entfernen“, die gerade erst wiederhergestellt wurde.
    this.history.length = 0
    this.history.push({ kind: 'clear', beads: cleared })
    this.emitChange()

    return cleared
  }

  /** Macht die letzte Aktion rückgängig — Perle setzen oder Brett leeren. */
  undo(): UndoResult | null {
    const entry = this.history.pop()
    if (!entry) return null

    if (entry.kind === 'place') {
      this.slotsOf(entry.bead.channelId)[entry.bead.slotIndex] = null
      this.emitChange()
      return { removed: [entry.bead], restored: [] }
    }

    // Nur in Slots zurücklegen, die inzwischen nicht neu belegt wurden.
    const restored: Bead[] = []
    for (const bead of entry.beads) {
      const slots = this.slotsOf(bead.channelId)
      if (slots[bead.slotIndex]) continue
      slots[bead.slotIndex] = bead
      this.history.push({ kind: 'place', bead })
      restored.push(bead)
    }
    this.emitChange()

    return { removed: [], restored }
  }

  /** Gibt es eine Aktion, die sich zurücknehmen lässt? */
  canUndo(): boolean {
    return this.history.length > 0
  }

  /** Gesamtzahl gesetzter Perlen über alle Rillen. */
  total(): number {
    return this.listChannels().reduce((sum, channel) => sum + this.count(channel.id), 0)
  }

  /** Alle gesetzten Perlen einer Rille, in Slot-Reihenfolge. */
  listBeads(channelId: ChannelId): Bead[] {
    return this.slotsOf(channelId).filter((slot): slot is Bead => slot !== null)
  }

  count(channelId: ChannelId): number {
    return this.slotsOf(channelId).reduce<number>((total, slot) => total + (slot ? 1 : 0), 0)
  }

  capacity(channelId: ChannelId): number {
    return this.getChannel(channelId).positions.length
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private slotsOf(channelId: ChannelId): (Bead | null)[] {
    const slots = this.occupancy.get(channelId)
    if (!slots) throw new Error(`Unbekannte Rille: ${channelId}`)
    return slots
  }

  private emitChange(): void {
    for (const listener of this.listeners) listener()
  }
}
