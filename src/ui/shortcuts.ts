/**
 * Tastenkürzel, die auch dann greifen, wenn `keydown` nie ankommt.
 *
 * Browser-Erweiterungen und Browser-Eigenheiten (etwa die Schnellsuche in
 * Firefox, die beim Tippen den Fokus an die Browseroberfläche zieht) fangen
 * `keydown` mitunter ab, bevor die Seite es überhaupt sieht. `keyup` kommt in
 * diesen Fällen trotzdem durch. Deshalb horchen die Kürzel hier auf beides —
 * lösen pro Anschlag aber nur ein einziges Mal aus.
 */

/** Kürzel dürfen nicht zuschlagen, während jemand Text eingibt. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export interface ShortcutOptions {
  /**
   * Greift auch, während im Suchfeld getippt wird. Gedacht für die Ziffern:
   * kein Steinname und kein Farbzusatz enthält eine Ziffer, im Suchfeld geht
   * also nichts verloren — und das Suchfeld behält nach dem Tippen den Fokus,
   * womit die Ziffern sonst ins Leere liefen.
   */
  whileTyping?: boolean
}

/**
 * Die Ziffer hinter einem Anschlag.
 *
 * `event.key` ist der Normalfall. Es reicht aber nicht: auf dem Ziffernblock
 * ohne NumLock meldet der Browser `End`, `ArrowDown` und so weiter statt einer
 * Ziffer — dieselbe Taste tut dann mal was und mal nicht, je nachdem wie
 * NumLock gerade steht. Deshalb zusätzlich die physische Taste auswerten.
 */
export function digitOf(event: Pick<KeyboardEvent, 'key' | 'code'>): number | null {
  const fromKey = Number.parseInt(event.key, 10)
  if (event.key.length === 1 && Number.isInteger(fromKey)) return fromKey

  const physical = /^(?:Digit|Numpad)([0-9])$/.exec(event.code)
  return physical?.[1] === undefined ? null : Number(physical[1])
}

/**
 * `handle` bekommt das Ereignis und meldet mit `true` zurück, dass es das
 * Kürzel ausgeführt hat.
 *
 * Damit ein Anschlag nicht doppelt zählt, merkt sich die Registrierung, für
 * welche Tasten ein `keydown` angekommen ist; deren `keyup` ist dann nur noch
 * das Ende desselben Anschlags und wird übersprungen. Ein Zeitfenster braucht
 * es dafür nicht — und verklemmen kann sich das auch nicht: bleibt ein `keyup`
 * einmal aus, räumt das nächste `keyup` derselben Taste den Eintrag ab, und der
 * `keydown`-Pfad fragt ihn ohnehin nicht ab.
 */
export function registerShortcut(
  handle: (event: KeyboardEvent) => boolean,
  options: ShortcutOptions = {},
): void {
  /** Tasten, deren `keydown` diese Registrierung gesehen hat. */
  const seenKeyDown = new Set<string>()

  const run = (event: KeyboardEvent, isKeyDown: boolean): void => {
    if (!options.whileTyping && isTypingTarget(event.target)) return

    if (isKeyDown) {
      handle(event)
      seenKeyDown.add(event.code)
      return
    }

    // Das `keyup` zum eben verarbeiteten `keydown` gehört zum selben Anschlag.
    if (seenKeyDown.delete(event.code)) return

    handle(event)
  }

  // Capture-Phase, damit kein zwischenliegender Handler dazwischenkommt.
  window.addEventListener('keydown', (event) => run(event, true), { capture: true })
  window.addEventListener('keyup', (event) => run(event, false), { capture: true })
}
