// Genera las capturas de la app a 360 px y 1280 px: Despensa, Recetas y hoja de agregar con error.
// Requiere: servidor en marcha (npm run dev) y "npm install --no-save playwright-core" (NO es dependencia del proyecto).
// Uso: node scripts/capturas.mjs [carpeta]   (por defecto docs/capturas)   Variables: URL, EDGE_PATH
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const URL = process.env.URL ?? 'http://localhost:5173/'
const SALIDA = process.argv[2] ?? 'docs/capturas'
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
mkdirSync(SALIDA, { recursive: true })

const browser = await chromium.launch({ executablePath: EDGE, headless: true })

// Recorre la página para que se revelen todas las bandas (IntersectionObserver) y espera a que terminen de entrar.
async function revelarTodo(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= alto; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await page.waitForTimeout(60)
  }
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
}

// Captura de página completa. La barra inferior es position:fixed y saldría a media página: se oculta solo en esta captura.
async function completa(page, ruta) {
  const estilo = await page.addStyleTag({ content: 'nav[aria-label="Secciones"] { visibility: hidden !important; }' })
  await page.screenshot({ path: ruta, fullPage: true })
  await estilo.evaluate((e) => e.remove())
}

for (const [nombre, ancho, alto] of [['360', 360, 800], ['1280', 1280, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, locale: 'es-CO' })
  const page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForSelector('[data-testid=resumen]')

  await revelarTodo(page)
  await page.screenshot({ path: `${SALIDA}/despensa-${nombre}-vista.png` }) // lo que se ve al abrir, con la barra inferior
  await completa(page, `${SALIDA}/despensa-${nombre}.png`)

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: 'Recetas' }).click()
  await page.waitForSelector('[data-testid=lista-cocinables]')
  await revelarTodo(page)
  await page.screenshot({ path: `${SALIDA}/recetas-${nombre}-vista.png` })
  await completa(page, `${SALIDA}/recetas-${nombre}.png`)

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: 'Despensa' }).click()
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  const form = page.getByRole('form', { name: 'Agregar ingrediente' })
  await form.getByLabel('Cantidad', { exact: true }).fill('-3')
  await form.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SALIDA}/hoja-agregar-error-${nombre}.png` })
  await ctx.close()
}
await browser.close()
console.log(`Capturas guardadas en ${SALIDA}`)
