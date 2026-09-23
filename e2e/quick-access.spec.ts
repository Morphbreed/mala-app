import { expect, test, type Page } from '@playwright/test'

/**
 * Der Schnellzugriff und seine Zifferntasten 1–9.
 *
 * Der Fall, der in der Praxis gehakt hat, ist „Ziffer bei Fokus im Suchfeld":
 * das Suchfeld sitzt direkt unter der Leiste und behält nach dem Tippen den
 * Fokus — die Ziffer landete dort im Text statt die Perle zu wechseln.
 */

const FAVOURITES_KEY = 'mala-app:favourites'
/** Drei Steine mit Namen, die sich in der Kopfzeile eindeutig prüfen lassen. */
const FAVOURITES = ['achat', 'amazonit', 'amethyst']
const NAMES = ['Achat', 'Amazonit', 'Amethyst']

declare global {
  interface Window {
    __mala: {
      nextSlotScreenPosition(channelId: string): { x: number; y: number } | null
      place(channelId: string, count: number, stoneId: string): void
      counts(): string
      selectedStone(): string
      stonesOn(channelId: string): string[]
    }
  }
}

async function open(page: Page, favourites: string[] = FAVOURITES): Promise<void> {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [FAVOURITES_KEY, JSON.stringify(favourites)] as const,
  )
  await page.goto('/')
  await page.waitForFunction(() => document.querySelectorAll('.stone-row').length === 71)
  await page.waitForFunction(() => typeof window.__mala?.selectedStone === 'function')
}

/** Index der aktuell markierten Kachel, -1 wenn keine markiert ist. */
function selectedSlot(page: Page): Promise<number> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.quick-item')].findIndex((item) =>
      item.classList.contains('is-selected'),
    ),
  )
}

test('Stern legt einen Stein in den Schnellzugriff und vergibt eine Ziffer', async ({ page }) => {
  await open(page, [])
  await expect(page.locator('.quick-empty')).toBeVisible()

  const stars = page.locator('.stone-row .stone-star')
  for (const index of [0, 1, 2]) await stars.nth(index).click()

  await expect(page.locator('.quick-item')).toHaveCount(3)
  await expect(page.locator('.quick-index')).toHaveText(['1', '2', '3'])
})

test('Zifferntaste wechselt die Steinsorte', async ({ page }) => {
  await open(page)
  await expect(page.locator('#stone-selected .stone-name')).toHaveText('Lapislazuli')

  await page.keyboard.press('2')
  await expect(page.locator('#stone-selected .stone-name')).toHaveText(NAMES[1]!)
  expect(await selectedSlot(page)).toBe(1)
  expect(await page.evaluate(() => window.__mala.selectedStone())).toBe(FAVOURITES[1])

  await page.keyboard.press('1')
  await expect(page.locator('#stone-selected .stone-name')).toHaveText(NAMES[0]!)
  expect(await selectedSlot(page)).toBe(0)
})

test('Zifferntaste greift auch, während das Suchfeld den Fokus hat', async ({ page }) => {
  await open(page)

  const search = page.locator('#stone-search')
  await search.click()
  await search.type('ach')
  await expect(search).toBeFocused()

  await page.keyboard.press('3')

  // Die Auswahl wechselt …
  await expect(page.locator('#stone-selected .stone-name')).toHaveText(NAMES[2]!)
  expect(await selectedSlot(page)).toBe(2)
  // … und die Ziffer landet nicht im Suchtext.
  await expect(search).toHaveValue('ach')
  await expect(search).not.toBeFocused()
})

test('Ziffer auf einen leeren Platz quittiert sichtbar, ohne die Auswahl zu ändern', async ({
  page,
}) => {
  await open(page)
  const before = await page.evaluate(() => window.__mala.selectedStone())

  // Die Quittung blitzt nur gut 250 ms auf — ein Polling danach käme zu spät,
  // also vorher mitschreiben, ob die Klasse überhaupt gesetzt wurde.
  await page.evaluate(() => {
    const bar = document.getElementById('stone-quick')!
    ;(window as unknown as { __flashed: boolean }).__flashed = false
    new MutationObserver(() => {
      if (bar.classList.contains('is-empty-hit')) {
        ;(window as unknown as { __flashed: boolean }).__flashed = true
      }
    }).observe(bar, { attributes: true, attributeFilter: ['class'] })
  })

  await page.keyboard.press('9')

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __flashed: boolean }).__flashed))
    .toBe(true)
  expect(await page.evaluate(() => window.__mala.selectedStone())).toBe(before)
})

test('die per Taste gewählte Sorte landet auf der gesetzten Perle', async ({ page }) => {
  await open(page)
  await page.keyboard.press('3')

  const spot = await page.evaluate(() => window.__mala.nextSlotScreenPosition('mala'))
  expect(spot).not.toBeNull()
  await page.mouse.click(spot!.x, spot!.y)

  await expect
    .poll(() => page.evaluate(() => window.__mala.counts()))
    .toContain('mala:1')
  expect(await page.evaluate(() => window.__mala.stonesOn('mala'))).toEqual([FAVOURITES[2]])
})

test('der Ziffernblock greift auch ohne NumLock', async ({ page }) => {
  await open(page)

  // Ohne NumLock meldet der Browser für Numpad1 die Taste `End` statt `1`.
  // Ausgewertet wird deshalb zusätzlich die physische Taste.
  await page.evaluate(() => {
    for (const type of ['keydown', 'keyup']) {
      window.dispatchEvent(
        new KeyboardEvent(type, { key: 'End', code: 'Numpad1', bubbles: true, cancelable: true }),
      )
    }
  })

  expect(await page.evaluate(() => window.__mala.selectedStone())).toBe(FAVOURITES[0])
})

test('der Schnellzugriff übersteht einen Reload', async ({ page }) => {
  await open(page)
  await page.keyboard.press('2')
  await page.reload()
  await page.waitForFunction(() => document.querySelectorAll('.stone-row').length === 71)

  await expect(page.locator('.quick-index')).toHaveText(['1', '2', '3'])
  await page.keyboard.press('2')
  await expect(page.locator('#stone-selected .stone-name')).toHaveText(NAMES[1]!)
})

test('eine Ziffer klappt das eingeklappte Panel wieder auf', async ({ page }) => {
  await open(page)
  await page.locator('#stone-toggle').click()
  await expect(page.locator('#stone-picker')).toHaveClass(/is-collapsed/)

  await page.keyboard.press('3')

  await expect(page.locator('#stone-picker')).not.toHaveClass(/is-collapsed/)
  await expect(page.locator('#stone-selected .stone-name')).toHaveText(NAMES[2]!)
})
