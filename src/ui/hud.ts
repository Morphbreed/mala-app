import type { BeadActions } from '../interaction/beadActions'
import type { MalaState } from '../state/malaState'

/**
 * Zeigt pro Rille, wie viele Perlen von wie vielen möglichen gesetzt sind, und
 * bietet den Knopf zum Leeren des Bretts an.
 */
export function setupHud(state: MalaState, actions: BeadActions): void {
  const container = document.getElementById('counts')
  const undoButton = document.getElementById('undo-action')
  const clearButton = document.getElementById('clear-board')
  if (
    !container ||
    !(undoButton instanceof HTMLButtonElement) ||
    !(clearButton instanceof HTMLButtonElement)
  ) {
    throw new Error('HUD-Markup fehlt im HTML')
  }

  const values = new Map<string, HTMLElement>()
  for (const channel of state.listChannels()) {
    const block = document.createElement('div')

    const label = document.createElement('div')
    label.className = 'count-label'
    label.textContent = channel.label

    const value = document.createElement('div')
    value.className = 'count-value'

    block.append(label, value)
    container.append(block)
    values.set(channel.id, value)
  }

  // Auch per Strg+Z erreichbar — aber nicht überall: manche Browser und
  // Erweiterungen fangen Tastendrücke ab, bevor die Seite sie sieht. Der Knopf
  // ist der Weg, der immer funktioniert.
  undoButton.addEventListener('click', () => actions.undo())
  clearButton.addEventListener('click', () => actions.clear())

  const render = (): void => {
    for (const channel of state.listChannels()) {
      const value = values.get(channel.id)
      if (!value) continue
      value.innerHTML = `${state.count(channel.id)} <span class="max">/ ${state.capacity(channel.id)}</span>`
    }
    // Auf leerem Brett gibt es nichts zu entfernen.
    clearButton.disabled = state.total() === 0
    undoButton.disabled = !state.canUndo()
  }

  state.onChange(render)
  render()
}
