// Prueba de navegador de la Fase 2 (Edge/Chrome real con Playwright).
// Requiere: servidor en marcha (npm run dev) y "npm install --no-save playwright-core" (NO es dependencia del proyecto).
// Uso: node scripts/e2e-fase2.mjs [carpeta-de-capturas]   Variables: URL, EDGE_PATH
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const URL = process.env.URL ?? 'http://localhost:5173/'
const SHOTS = process.argv[2] ?? 'capturas'
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
mkdirSync(SHOTS, { recursive: true })

let fallos = 0
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'OK  ' : 'FALLA'}  ${msg}${cond ? '' : '  → ' + extra}`)
  if (!cond) fallos++
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const errores = []
const nuevaPagina = async (ctx) => {
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(String(e)))
  p.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
  return p
}
const nombresDe = (p, sel) => p.$$eval(`${sel} li p.font-semibold`, (els) => els.map((e) => e.textContent.trim()))

// ───────── 1. Primera carga (sin datos) a 360 px ─────────
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, locale: 'es-CO' })
let page = await nuevaPagina(ctx)
await page.goto(URL)
await page.waitForSelector('[data-testid=resumen]')

const resumen = await page.textContent('[data-testid=resumen]')
ok(/9 registros/.test(resumen) && /4 por vencer/.test(resumen) && /2 vencidos/.test(resumen), 'Resumen: 9 registros · 4 por vencer · 2 vencidos', resumen)

const vigentes = await nombresDe(page, '[data-testid=lista-vigentes]')
ok(JSON.stringify(vigentes) === JSON.stringify(['Pollo', 'Tomate', 'Huevos', 'Queso', 'Cebolla', 'Harina de maíz', 'Arroz']),
  'Vigentes ordenados por vencimiento (Pollo hoy → … → Arroz)', vigentes.join(', '))

const vencidos = await nombresDe(page, '[data-testid=lista-vencidos]')
ok(JSON.stringify(vencidos) === JSON.stringify(['Arroz', 'Leche']), 'Vencidos en sección aparte (Arroz −5, Leche −1)', vencidos.join(', '))

const estadoPollo = await page.getAttribute('[data-testid=lista-vigentes] li:first-child', 'data-estado')
ok(estadoPollo === 'por-vencer', 'Pollo (vence hoy) NO está vencido: aparece como por vencer', estadoPollo)
const textoPollo = await page.textContent('[data-testid=lista-vigentes] li:first-child')
ok(/vence hoy/.test(textoPollo) && /Por vencer/.test(textoPollo), 'Pollo dice "vence hoy" + insignia "Por vencer" (texto, no solo color)', textoPollo)
const estadosVig = await page.$$eval('[data-testid=lista-vigentes] li', (l) => l.map((e) => e.dataset.estado))
ok(JSON.stringify(estadosVig) === JSON.stringify(['por-vencer', 'por-vencer', 'por-vencer', 'por-vencer', 'vigente', 'vigente', 'vigente']),
  'Resaltado: 4 por vencer y 3 vigentes', estadosVig.join(','))
const sinAviso = await page.$('[role=alert]')
ok(!sinAviso, 'Primera carga sin aviso')
ok(await page.evaluate(() => localStorage.getItem('foodsaver:v1') !== null), 'El seed quedó guardado en localStorage (foodsaver:v1)')
const anchoDoc = await page.evaluate(() => document.documentElement.scrollWidth)
ok(anchoDoc <= 360, 'Sin scroll horizontal a 360 px', String(anchoDoc))
await page.screenshot({ path: `${SHOTS}/despensa-360.png`, fullPage: true })

// ───────── 2. Pantalla Recetas ─────────
await page.click('text=Recetas')
await page.waitForSelector('[data-testid=lista-cocinables]')
const cocinables = await page.$$eval('[data-testid=lista-cocinables] > li', (l) => l.map((e) => e.dataset.receta))
const parciales = await page.$$eval('[data-testid=lista-parciales] > li', (l) => l.map((e) => e.dataset.receta))
console.log('   cocinables:', cocinables.join(' | '))
console.log('   parciales :', parciales.join(' | '))
ok(cocinables[0] === 'Huevos pericos', 'Huevos pericos es la primera cocinable', cocinables[0])
ok(cocinables.length >= 3, `Hay ≥3 cocinables (${cocinables.length})`)
ok(!cocinables.includes('Arroz con leche') && parciales.includes('Arroz con leche'), 'Arroz con leche NO es cocinable (está en parciales)')

const tPericos = await page.textContent('[data-receta="Huevos pericos"]')
ok(/Aprovecha lo que está por vencer/.test(tPericos) && /huevos \(vence en 2 días\)/i.test(tPericos) && /tomate \(vence mañana\)/i.test(tPericos),
  'Huevos pericos muestra: aprovecha Huevos (en 2 días) y Tomate (mañana)', tPericos)
const tLeche = await page.textContent('[data-receta="Arroz con leche"]')
ok(/Lo que tienes de leche está vencido/.test(tLeche) && /Faltan 1/.test(tLeche), 'Arroz con leche explica: leche está vencido (Faltan 1)', tLeche)
const motivos = await page.$$eval('[data-receta="Arroz con leche"] [data-motivo]', (l) => l.map((e) => e.dataset.motivo))
ok(motivos.join() === 'vencido', 'Motivo del faltante = vencido', motivos.join())
const tSandwich = await page.textContent('[data-receta="Sándwich gratinado"]')
ok(/Faltan 2/.test(tSandwich) && /Te falta pan: necesitas 2 unidades y no tienes/.test(tSandwich), 'Sándwich: 2 faltantes con mensaje claro', tSandwich)
const unaFalta = await page.$$eval('[data-testid=lista-parciales] > li', (l) => l.filter((e) => e.querySelectorAll('[data-motivo]').length === 1).length)
ok(unaFalta >= 2, `≥2 parciales con 1 faltante (${unaFalta})`)
await page.click('[data-receta="Huevos pericos"] summary')
const prep = await page.textContent('[data-receta="Huevos pericos"] ol')
ok(/sofríelos/.test(prep), 'Se despliega la preparación de Huevos pericos')
await page.screenshot({ path: `${SHOTS}/recetas-360.png`, fullPage: true })

// ───────── 3. Recarga: conserva datos ─────────
const antes = await page.evaluate(() => localStorage.getItem('foodsaver:v1'))
await page.reload()
await page.waitForSelector('[data-testid=resumen]')
const despues = await page.evaluate(() => localStorage.getItem('foodsaver:v1'))
ok(antes === despues, 'Recarga: localStorage idéntico (el seed NO se regenera)')
ok((await nombresDe(page, '[data-testid=lista-vigentes]')).join() === vigentes.join(), 'Recarga: misma lista y mismo orden')
ok(!(await page.$('[role=alert]')), 'Recarga: sin aviso')

// ───────── 4. Grupo 10 en navegador: cambios en el almacenamiento sobreviven a recargas ─────────
// (los formularios de agregar/editar/borrar son de la Fase 3; aquí se simulan las tres operaciones sobre lo guardado)
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('foodsaver:v1'))
  d.ingredientes = d.ingredientes.filter((i) => i.id !== 'seed-tomate') // borrar
  d.ingredientes.find((i) => i.id === 'seed-huevos').cantidad = 1 // editar
  const hoy = new Date(); const f = (n) => { const x = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
  d.ingredientes.push({ id: 'nuevo-1', nombre: 'Yogur', cantidad: 2, unidad: 'unidad', vence: f(2) }) // agregar
  localStorage.setItem('foodsaver:v1', JSON.stringify(d))
})
for (let i = 1; i <= 2; i++) {
  await page.reload()
  await page.waitForSelector('[data-testid=resumen]')
  const v = await nombresDe(page, '[data-testid=lista-vigentes]')
  ok(!v.includes('Tomate') && v.includes('Yogur'), `Recarga ${i}: tomate borrado y yogur agregado persisten`, v.join(', '))
}
const filaHuevos = await page.$$eval('[data-testid=lista-vigentes] li', (l) => l.find((e) => e.textContent.includes('Huevos'))?.textContent)
ok(/1 unidad/.test(filaHuevos), 'Recarga: la edición de huevos (1 unidad) persiste', filaHuevos)
await page.click('text=Recetas')
const pericos2 = await page.getAttribute('[data-receta="Huevos pericos"]', 'data-estado')
ok(pericos2 === 'parcial', 'Sin tomate y con 1 huevo, Huevos pericos pasa a parcial (las recetas reaccionan a los cambios)', pericos2)

// borrar TODO persiste vacío
await page.evaluate(() => localStorage.setItem('foodsaver:v1', JSON.stringify({ version: 1, ingredientes: [] })))
await page.reload()
await page.waitForSelector('text=Tu despensa está vacía')
ok(true, 'Despensa vacía guardada: se muestra vacía (no vuelve el seed)')
ok(!(await page.$('[role=alert]')), 'Vacía: sin aviso')
await page.click('text=Recetas')
await page.waitForSelector('[data-testid=lista-parciales]')
const vacias = await page.$$eval('[data-testid=lista-parciales] > li', (l) => l.length)
const cocVacia = await page.$('[data-testid=lista-cocinables]')
ok(vacias === 12 && !cocVacia, 'Grupo 7 en navegador: despensa vacía → 12 recetas parciales, 0 cocinables, sin errores', `${vacias}`)
await page.screenshot({ path: `${SHOTS}/recetas-vacia-360.png`, fullPage: true })

// ───────── 5. Grupo 8: localStorage corrupto / formato viejo ─────────
const casos = [
  ['JSON roto', '{"version":1,"ingredientes":[{"id"'],
  ['formato viejo', '[{"nombre":"Tomate","qty":2}]'],
  ['cantidad negativa', JSON.stringify({ version: 1, ingredientes: [{ id: 'a', nombre: 'X', cantidad: -1, unidad: 'g', vence: '2026-03-20' }] })],
]
for (const [nombre, texto] of casos) {
  await page.evaluate(([t]) => { localStorage.setItem('foodsaver:v1', t); localStorage.removeItem('foodsaver:v1:respaldo') }, [texto])
  await page.reload()
  await page.waitForSelector('[data-testid=resumen]')
  const alerta = await page.textContent('[role=alert]').catch(() => null)
  ok(alerta && /datos de ejemplo/.test(alerta), `Corrupto (${nombre}): app NO se rompe, muestra aviso`, String(alerta))
  ok((await page.textContent('[data-testid=resumen]')).includes('9 registros'), `Corrupto (${nombre}): vuelve al seed (9 registros)`)
  ok((await page.evaluate(() => localStorage.getItem('foodsaver:v1:respaldo'))) === texto, `Corrupto (${nombre}): se guarda copia del original`)
  await page.click('text=Entendido')
  ok(!(await page.$('[role=alert]')), `Corrupto (${nombre}): el aviso se puede cerrar`)
  await page.reload()
  await page.waitForSelector('[data-testid=resumen]')
  ok(!(await page.$('[role=alert]')), `Corrupto (${nombre}): en la siguiente recarga ya no hay aviso`)
}

// ───────── 6. Cambio de día (reloj simulado) ─────────
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-CO' })
const p2 = await nuevaPagina(ctx2)
await p2.clock.install({ time: new Date(2026, 2, 15, 22, 0, 0) })
await p2.goto(URL)
await p2.waitForSelector('[data-testid=resumen]')
const r0 = await p2.textContent('[data-testid=resumen]')
ok(/4 por vencer/.test(r0) && /2 vencidos/.test(r0), 'Reloj 15/03 22:00: 4 por vencer, 2 vencidos', r0)
const pollo0 = await p2.textContent('[data-testid=lista-vigentes] li:first-child')
ok(/Pollo/.test(pollo0) && /vence hoy/.test(pollo0), 'Reloj 15/03: Pollo vence hoy', pollo0)
await p2.screenshot({ path: `${SHOTS}/despensa-1280.png`, fullPage: true })
await p2.clock.fastForward(4 * 3600 * 1000) // pasa la medianoche con la pestaña abierta → 16/03 02:00
await p2.waitForTimeout(300)
const r1 = await p2.textContent('[data-testid=resumen]')
const venc1 = await nombresDe(p2, '[data-testid=lista-vencidos]')
ok(/3 vencidos/.test(r1) && venc1.includes('Pollo'), 'Pasada la medianoche (sin recargar): el Pollo pasa a vencidos', `${r1} | ${venc1.join(', ')}`)
await p2.clock.fastForward(72 * 3600 * 1000) // 19/03
await p2.waitForTimeout(300)
const r2 = await p2.textContent('[data-testid=resumen]')
ok(/0 por vencer/.test(r2) || /1 por vencer/.test(r2), 'Tres días después: cambia el contador de por vencer', r2)
await p2.click('text=Recetas')
const peric = await p2.getAttribute('[data-receta="Huevos pericos"]', 'data-estado')
ok(peric === 'parcial', 'Tres días después: Huevos pericos ya no es cocinable (tomate y huevos vencieron)', peric)

ok(errores.length === 0, 'Sin errores en consola ni excepciones de la página', errores.join(' | '))
await browser.close()
console.log(`\n${fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'}`)
process.exit(fallos === 0 ? 0 : 1)
