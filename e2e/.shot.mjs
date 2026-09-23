import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

await page.goto('http://localhost:5173/')
await page.waitForFunction(() => document.querySelectorAll('.stone-row').length === 71)
await page.evaluate(() => {
  window.__mala.place('mala', 42, 'lapislazuli')
  window.__mala.place('mala', 24, 'mondstein-creme')
  window.__mala.place('liuzhu', 50, 'baumachat')
  window.__mala.place('bracelet', 27, 'tigerauge')
})
await page.mouse.move(20, 800)
await page.waitForTimeout(700)
await page.screenshot({ path: process.argv[2] })
console.log('Zähler:', (await page.locator('#counts').innerText()).replace(/\n/g, ' '))
console.log('Fehler:', errors.length ? errors : 'keine')
await browser.close()
