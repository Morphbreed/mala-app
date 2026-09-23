import { DEFAULT_STONE_ID, STONES, getStone, stoneLabel, type StoneDefinition } from '../stones/catalog'
import { getStoneCanvas } from '../stones/textures'
import { digitOf, registerShortcut } from './shortcuts'

const SWATCH_PX = 56
const FAVOURITES_KEY = 'mala-app:favourites'
/** So viele Schnellzugriff-Plätze bekommen eine Zifferntaste. */
const SHORTCUT_COUNT = 9

export interface StonePicker {
  getSelectedId(): string
  /** Meldet jeden Wechsel der Steinsorte — auch den per Zifferntaste. */
  onChange(listener: (stoneId: string) => void): void
}

interface RowHandles {
  row: HTMLDivElement
  star: HTMLButtonElement
  pick: HTMLButtonElement
}

/**
 * Auswahl aller runden Perlen aus dem Shop. Die Kacheln zeigen dieselbe
 * prozedurale Textur, die auch auf der Perle landet — die Vorschau entspricht
 * also exakt dem Ergebnis.
 *
 * Für eine Kette braucht man meist nur zwei, drei Sorten. Die lassen sich mit
 * dem Stern markieren und liegen dann oben im Schnellzugriff, samt Zifferntaste
 * — ohne jedes Mal durch 71 Einträge zu scrollen. Die Markierungen überleben
 * einen Reload.
 *
 * Die Texturen werden erst berechnet, wenn eine Zeile ins Sichtfeld scrollt;
 * alle auf einmal zu rendern würde den Start spürbar bremsen.
 */
export function setupStonePicker(): StonePicker {
  const panel = document.getElementById('stone-picker')
  const list = document.getElementById('stone-list')
  const quick = document.getElementById('stone-quick')
  const search = document.getElementById('stone-search')
  const toggle = document.getElementById('stone-toggle')
  if (!panel || !list || !quick || !(search instanceof HTMLInputElement) || !toggle) {
    throw new Error('Markup des Perlenselektors fehlt im HTML')
  }

  let selectedId = DEFAULT_STONE_ID
  const favourites = loadFavourites()
  const rows = new Map<string, RowHandles>()
  /** Die gerenderten Kacheln in Slot-Reihenfolge — für die Tastenrückmeldung. */
  const quickItems: HTMLElement[] = []
  const listeners = new Set<(stoneId: string) => void>()

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const canvas = entry.target as HTMLCanvasElement
        paintSwatch(canvas, canvas.dataset['stoneId'] ?? DEFAULT_STONE_ID)
        observer.unobserve(canvas)
      }
    },
    { root: list, rootMargin: '120px' },
  )

  const header = buildSelectedHeader(panel)

  const select = (stoneId: string): void => {
    rows.get(selectedId)?.row.classList.remove('is-selected')
    selectedId = stoneId
    rows.get(stoneId)?.row.classList.add('is-selected')
    header.update(getStone(stoneId))
    renderQuick()
    for (const listener of listeners) listener(stoneId)
  }

  const toggleFavourite = (stoneId: string): void => {
    const index = favourites.indexOf(stoneId)
    if (index === -1) favourites.push(stoneId)
    else favourites.splice(index, 1)

    saveFavourites(favourites)
    const star = rows.get(stoneId)?.star
    if (star) setStarState(star, index === -1)
    renderQuick()
  }

  function renderQuick(): void {
    quickItems.length = 0
    quick!.replaceChildren()

    if (favourites.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'quick-empty'
      empty.textContent = 'Noch leer. In der Liste unten auf ☆ tippen, dann liegt der Stein hier — mit Zifferntaste.'
      quick!.append(empty)
      return
    }

    favourites.forEach((stoneId, index) => {
      const item = buildQuickItem(getStone(stoneId), index, stoneId === selectedId, select, toggleFavourite)
      quickItems.push(item)
      quick!.append(item)
    })
  }

  for (const stone of STONES) {
    const handles = buildRow(stone, observer, favourites.includes(stone.id))
    handles.pick.addEventListener('click', () => select(stone.id))
    handles.star.addEventListener('click', () => toggleFavourite(stone.id))
    rows.set(stone.id, handles)
    list.append(handles.row)
  }

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase()
    for (const stone of STONES) {
      const matches = query === '' || stoneLabel(stone).toLowerCase().includes(query)
      rows.get(stone.id)?.row.classList.toggle('is-hidden', !matches)
    }
  })

  const setCollapsed = (collapsed: boolean): void => {
    panel.classList.toggle('is-collapsed', collapsed)
    toggle.textContent = collapsed ? '‹' : '›'
    toggle.setAttribute('aria-label', collapsed ? 'Perlenauswahl öffnen' : 'Perlenauswahl schließen')
  }

  toggle.addEventListener('click', () => setCollapsed(!panel.classList.contains('is-collapsed')))

  registerShortcut(
    (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return false

      const slot = digitOf(event)
      if (slot === null || slot < 1 || slot > SHORTCUT_COUNT) return false

      // Ziffern gehören der App, auch wenn der Platz leer ist. Ohne das
      // preventDefault() landet die Ziffer im Suchfeld, und Firefox öffnet seine
      // Schnellsuche und zieht den Fokus aus der Seite — danach kommt kein
      // Tastendruck mehr hier an.
      event.preventDefault()

      const stoneId = favourites[slot - 1]
      if (!stoneId) {
        // Die Taste kam an, der Platz ist nur leer. Ohne dieses Signal sieht
        // beides gleich aus — und das Kürzel wirkt kaputt.
        flash(quick!, 'is-empty-hit')
        return true
      }

      // Eingeklappt bekäme man vom Wechsel nichts mit.
      setCollapsed(false)
      select(stoneId)
      // select() baut die Leiste neu auf, das Aufblitzen also erst danach.
      const item = quickItems[slot - 1]
      if (item) flash(item, 'is-hit')
      // Zurück aus dem Suchfeld, sonst tippt der nächste Anschlag wieder dorthin.
      if (document.activeElement === search) search.blur()

      return true
    },
    // Ziffern greifen auch im Suchfeld: kein Steinname enthält eine Ziffer,
    // dort ginge also nichts verloren — das Feld behält nach dem Tippen aber
    // den Fokus und verschluckte die Kürzel bisher.
    { whileTyping: true },
  )

  select(DEFAULT_STONE_ID)
  rows.get(DEFAULT_STONE_ID)?.row.scrollIntoView({ block: 'center' })

  return {
    getSelectedId: () => selectedId,
    onChange: (listener) => listeners.add(listener),
  }
}


function buildRow(
  stone: StoneDefinition,
  observer: IntersectionObserver,
  isFavourite: boolean,
): RowHandles {
  const row = document.createElement('div')
  row.className = 'stone-row'

  const pick = document.createElement('button')
  pick.type = 'button'
  pick.className = 'stone-pick'
  pick.title = stoneLabel(stone)

  const canvas = document.createElement('canvas')
  canvas.className = 'stone-swatch'
  canvas.dataset['stoneId'] = stone.id
  observer.observe(canvas)

  const text = document.createElement('span')
  text.className = 'stone-text'

  const name = document.createElement('span')
  name.className = 'stone-name'
  name.textContent = stone.name

  const color = document.createElement('span')
  color.className = 'stone-color'
  color.textContent = stone.colorLabel

  text.append(name, color)
  pick.append(canvas, text)

  const star = document.createElement('button')
  star.type = 'button'
  star.className = 'stone-star'
  setStarState(star, isFavourite)

  row.append(pick, star)

  return { row, star, pick }
}

/**
 * Gefüllter Stern für markiert, offener für nicht markiert. Nur über die
 * Farbe zu unterscheiden reicht nicht — der Stern war so blass, dass man ihn
 * gar nicht erst gefunden hat.
 */
function setStarState(star: HTMLButtonElement, isFavourite: boolean): void {
  star.textContent = isFavourite ? '★' : '☆'
  star.title = isFavourite ? 'Aus Schnellzugriff entfernen' : 'Zum Schnellzugriff hinzufügen'
  star.setAttribute('aria-pressed', String(isFavourite))
}

/**
 * Kurzes Aufblitzen als Quittung für einen Tastendruck. Die Klasse wird erst
 * entfernt und nach einem erzwungenen Reflow neu gesetzt — sonst sieht der
 * Browser beim zweiten Anschlag derselben Taste keinen Wechsel und startet die
 * Animation gar nicht erst.
 */
function flash(element: HTMLElement, className: string): void {
  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true })
}

function buildQuickItem(
  stone: StoneDefinition,
  index: number,
  isSelected: boolean,
  onSelect: (stoneId: string) => void,
  onRemove: (stoneId: string) => void,
): HTMLElement {
  const item = document.createElement('div')
  item.className = 'quick-item'
  if (isSelected) item.classList.add('is-selected')

  const pick = document.createElement('button')
  pick.type = 'button'
  pick.className = 'quick-pick'
  pick.title =
    index < SHORTCUT_COUNT
      ? `${stoneLabel(stone)} — Taste ${index + 1}`
      : stoneLabel(stone)
  pick.addEventListener('click', () => onSelect(stone.id))

  const canvas = document.createElement('canvas')
  canvas.className = 'stone-swatch'
  paintSwatch(canvas, stone.id)
  pick.append(canvas)

  item.append(pick)

  if (index < SHORTCUT_COUNT) {
    const badge = document.createElement('span')
    badge.className = 'quick-index'
    badge.textContent = String(index + 1)
    item.append(badge)
  }

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'quick-remove'
  remove.textContent = '×'
  remove.title = 'Aus Schnellzugriff entfernen'
  remove.addEventListener('click', () => onRemove(stone.id))
  item.append(remove)

  return item
}

/** Kopfbereich mit der aktuell gewählten Perle und dem Link zum Shop. */
function buildSelectedHeader(panel: HTMLElement): { update: (stone: StoneDefinition) => void } {
  const host = panel.querySelector('#stone-selected')
  if (!host) throw new Error('#stone-selected fehlt im HTML')

  const canvas = document.createElement('canvas')
  canvas.className = 'stone-swatch stone-swatch--large'

  const text = document.createElement('div')
  text.className = 'stone-text'

  const name = document.createElement('span')
  name.className = 'stone-name'

  const color = document.createElement('span')
  color.className = 'stone-color'

  const link = document.createElement('a')
  link.className = 'stone-link'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'im Shop ansehen ↗'

  text.append(name, color, link)
  host.append(canvas, text)

  return {
    update: (stone) => {
      paintSwatch(canvas, stone.id)
      name.textContent = stone.name
      color.textContent = stone.colorLabel
      link.href = stone.shopUrl
    },
  }
}

function paintSwatch(canvas: HTMLCanvasElement, stoneId: string): void {
  const ratio = Math.min(window.devicePixelRatio, 2)
  const size = Math.round(SWATCH_PX * ratio)
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) return
  context.drawImage(getStoneCanvas(stoneId), 0, 0, size, size)
}

/** Markierungen überleben einen Reload — unbekannte IDs werden verworfen. */
function loadFavourites(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(FAVOURITES_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []
    const known = new Set(STONES.map((stone) => stone.id))
    return stored.filter((id): id is string => typeof id === 'string' && known.has(id))
  } catch {
    return []
  }
}

function saveFavourites(favourites: string[]): void {
  try {
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites))
  } catch {
    // Kein Speicher verfügbar (z.B. privater Modus) — dann eben nur für diese Sitzung.
  }
}
