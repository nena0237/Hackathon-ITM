// Prueba de navegador de la Fase 3 con la INTERFAZ REAL (Edge/Chrome con Playwright): agregar, editar,
// "usé" y borrar, recargando después de cada una; validaciones hostiles; estado vacío y "cargar ejemplo".
// Requiere: servidor en marcha (npm run dev) y "npm install --no-save playwright-core" (NO es dependencia del proyecto).
// Uso: node scripts/e2e-fase3.mjs [carpeta-de-capturas]   Variables: URL, EDGE_PATH
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

// Fecha local relativa al "hoy" simulado (15/03/2026) en formato YYYY-MM-DD
const HOY = new Date(2026, 2, 15, 10, 0, 0)
const f = (n) => {
  const d = new Date(2026, 2, 15 + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, locale: 'es-CO' })
const page = await ctx.newPage()
const errores = []
let dialogos = 0
page.on('pageerror', (e) => errores.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
page.on('dialog', (d) => { dialogos++; d.dismiss() })
await page.clock.install({ time: HOY })

const fila = (n) => page.locator(`li[data-nombre="${n}"]`)
const cuantas = (n) => fila(n).count()
const texto = (loc) => loc.first().textContent()
const registros = async () => Number((await page.textContent('[data-testid=resumen]')).match(/(\d+) registro/)[1])
const recargar = async () => { await page.reload(); await page.waitForSelector('[data-testid=resumen], [data-testid=estado-vacio]') }
const mensaje = () => page.locator('[role=status]').textContent()
const abrirAgregar = async () => { await page.getByRole('button', { name: '+ Agregar' }).click(); return page.getByRole('form', { name: 'Agregar ingrediente' }) }
const llenar = async (form, { nombre, cantidad, unidad, vence }) => {
  if (nombre !== undefined) await form.getByLabel('Nombre', { exact: true }).fill(nombre)
  if (cantidad !== undefined) await form.getByLabel('Cantidad', { exact: true }).fill(cantidad)
  if (unidad !== undefined) await form.getByLabel('Unidad', { exact: true }).selectOption(unidad)
  if (vence !== undefined) await form.getByLabel('Fecha de vencimiento', { exact: true }).fill(vence)
}
const errorsDe = async (form) => form.locator('[role=alert]').allTextContents()

await page.goto(URL)
await page.waitForSelector('[data-testid=resumen]')
ok((await registros()) === 9, 'Inicio: seed de 9 registros')

// ───────── 1. AGREGAR (R1) con "2,5" y recarga ─────────
let form = await abrirAgregar()
await llenar(form, { nombre: 'Yogur', cantidad: '2,5', unidad: 'l', vence: f(5) })
await form.getByRole('button', { name: 'Guardar', exact: true }).click()
ok((await mensaje()).includes('Ingrediente guardado'), 'Agregar: mensaje de confirmación')
ok((await cuantas('Yogur')) === 1 && /2,5 l/.test(await texto(fila('Yogur'))), 'Agregar: "2,5" se acepta y se muestra como 2,5 l', await texto(fila('Yogur')))
ok(!(await page.getByRole('form', { name: 'Agregar ingrediente' }).count()), 'Agregar: el formulario se cierra al guardar')
ok((await registros()) === 10, 'Agregar: ahora son 10 registros')
await recargar()
ok((await cuantas('Yogur')) === 1 && (await registros()) === 10 && /2,5 l/.test(await texto(fila('Yogur'))), 'RECARGA tras agregar: Yogur 2,5 l persiste (10 registros)')

// ───────── 2. Nombre repetido = otro lote ─────────
form = await abrirAgregar()
await llenar(form, { nombre: '  tomate ', cantidad: '3', unidad: 'unidad', vence: f(9) })
await form.getByRole('button', { name: 'Guardar', exact: true }).click()
const tomates = await page.locator('li[data-nombre]').evaluateAll((l) => l.filter((e) => e.dataset.nombre.trim().toLowerCase() === 'tomate').map((e) => e.textContent))
ok(tomates.length === 2, 'Nombre repetido: hay 2 lotes de tomate (no se fusiona ni se rechaza)', String(tomates.length))
await recargar()
ok((await page.locator('li[data-nombre]').evaluateAll((l) => l.filter((e) => e.dataset.nombre.trim().toLowerCase() === 'tomate').length)) === 2, 'RECARGA: siguen los 2 lotes de tomate')

// ───────── 3. VALIDACIONES HOSTILES en el formulario (R3) ─────────
form = await abrirAgregar()
await form.getByRole('button', { name: 'Guardar', exact: true }).click() // todo vacío
let errs = await errorsDe(form)
ok(errs.length === 3 && /nombre es obligatorio/.test(errs[0]) && /cantidad es obligatoria/.test(errs[1]) && /fecha de vencimiento es obligatoria/.test(errs[2]),
  'Formulario vacío: 3 errores en español, uno bajo cada campo', errs.join(' | '))
ok(await form.getByLabel('Nombre', { exact: true }).evaluate((e) => e === document.activeElement), 'El foco va al primer campo con error')
ok((await form.getByLabel('Nombre', { exact: true }).getAttribute('aria-invalid')) === 'true', 'El campo con error tiene aria-invalid')
await page.screenshot({ path: `${SHOTS}/f3-errores-360.png`, fullPage: true })

const antes = await registros()
const casosCantidad = [
  ['0', /mayor que 0/], ['-3', /mayor que 0/], ['abc', /número/], ['', /obligatoria/], ['1e9', /número/], ['1000000000', /demasiado grande/], ['Infinity', /número/],
]
for (const [valor, patron] of casosCantidad) {
  await llenar(form, { nombre: 'Prueba', cantidad: valor, unidad: 'g', vence: f(3) })
  await form.getByRole('button', { name: 'Guardar', exact: true }).click()
  const e = await errorsDe(form)
  ok(e.length === 1 && patron.test(e[0]), `Cantidad "${valor}": error claro bajo el campo → "${e[0]}"`, e.join(' | '))
}
ok((await registros()) === antes, 'Ninguna cantidad inválida agregó un registro')
await llenar(form, { nombre: 'x'.repeat(200), cantidad: '1', unidad: 'g', vence: f(3) })
await form.getByRole('button', { name: 'Guardar', exact: true }).click()
errs = await errorsDe(form)
ok(errs.length === 1 && /muy largo \(máximo 60/.test(errs[0]), 'Nombre de 200 caracteres: rechazado con mensaje del máximo', errs.join(' | '))
await llenar(form, { nombre: 'x'.repeat(60), cantidad: '1', vence: '' })
await form.getByRole('button', { name: 'Guardar', exact: true }).click()
errs = await errorsDe(form)
ok(errs.length === 1 && /fecha de vencimiento es obligatoria/.test(errs[0]), 'Fecha vacía: error bajo la fecha', errs.join(' | '))
ok((await registros()) === antes, 'Tampoco se agregó por nombre largo ni fecha vacía')
// los errores se corrigen y guarda (un nombre de 60 caracteres exactos y una fecha pasada sí se aceptan)
await llenar(form, { nombre: 'Pan viejo', cantidad: '1', unidad: 'unidad', vence: f(-1) })
await form.getByRole('button', { name: 'Guardar', exact: true }).click()
ok((await errorsDe(page.locator('body'))).filter((t) => /obligatori|mayor|número|largo/.test(t)).length === 0, 'Al corregir, desaparecen los errores')
ok((await page.locator('[data-testid=lista-vencidos] li[data-nombre="Pan viejo"]').count()) === 1, 'Fecha de ayer: se acepta y cae en Vencidos')
await recargar()
ok((await page.locator('[data-testid=lista-vencidos] li[data-nombre="Pan viejo"]').count()) === 1, 'RECARGA: "Pan viejo" sigue en Vencidos')
ok(dialogos === 0, 'Ningún alert/confirm del navegador hasta ahora', String(dialogos))

// ───────── 4. EDITAR (R1) ─────────
const tomateSeed = page.locator('li[data-id="seed-tomate"]')
await tomateSeed.getByRole('button', { name: 'Editar Tomate' }).click()
let fe = page.getByRole('form', { name: 'Editar Tomate' })
ok((await fe.getByLabel('Cantidad', { exact: true }).inputValue()) === '4' && (await fe.getByLabel('Nombre', { exact: true }).inputValue()) === 'Tomate', 'Editar: el formulario viene con los datos actuales')
await llenar(fe, { cantidad: '0' })
await fe.getByRole('button', { name: 'Guardar cambios' }).click()
errs = await errorsDe(fe)
ok(errs.length === 1 && /mayor que 0/.test(errs[0]), 'Editar con cantidad 0: error claro', errs.join(' | '))
await llenar(fe, { cantidad: '2,5', nombre: 'Tomate chonto' })
await fe.getByRole('button', { name: 'Guardar cambios' }).click()
ok((await mensaje()).includes('Cambios guardados'), 'Editar: mensaje de confirmación')
ok(/2,5 unidades/.test(await texto(page.locator('li[data-id="seed-tomate"]'))) && (await cuantas('Tomate chonto')) === 1, 'Editar: la fila muestra Tomate chonto, 2,5 unidades')
await recargar()
ok(/2,5 unidades/.test(await texto(page.locator('li[data-id="seed-tomate"]'))) && (await cuantas('Tomate chonto')) === 1, 'RECARGA tras editar: persiste')

// editar un vencido para volverlo vigente (Leche +10 días) y ver que las recetas reaccionan
await page.click('text=Recetas')
ok((await page.getAttribute('[data-receta="Arroz con leche"]', 'data-estado')) === 'parcial', 'Antes: Arroz con leche es parcial (leche vencida)')
await page.click('nav >> text=Despensa')
await page.locator('li[data-id="seed-leche"]').getByRole('button', { name: 'Editar Leche' }).click()
fe = page.getByRole('form', { name: 'Editar Leche' })
await llenar(fe, { vence: f(10) })
await fe.getByRole('button', { name: 'Guardar cambios' }).click()
ok((await page.locator('[data-testid=lista-vigentes] li[data-nombre="Leche"]').count()) === 1, 'Editar fecha: Leche pasa de Vencidos a vigentes')
await recargar()
ok((await page.locator('[data-testid=lista-vigentes] li[data-nombre="Leche"]').count()) === 1, 'RECARGA: Leche sigue vigente')
await page.click('text=Recetas')
ok((await page.getAttribute('[data-receta="Arroz con leche"]', 'data-estado')) === 'cocinable', 'Después: Arroz con leche ya es cocinable (las recetas reaccionan)')
await page.click('nav >> text=Despensa')

// ───────── 5. "USÉ" ─────────
const huevos = page.locator('li[data-id="seed-huevos"]')
ok((await page.locator('[data-testid=lista-vencidos] li').first().getByRole('button', { name: /^Usé/ }).count()) === 0, 'Los vencidos no tienen botón "Usé"')
await huevos.getByRole('button', { name: 'Usé Huevos' }).click()
const fu = page.getByRole('form', { name: 'Usar Huevos' })
for (const [valor, patron] of [['0', /mayor que 0/], ['-1', /mayor que 0/], ['abc', /número/], ['', /obligatoria/], ['7', /No puedes usar más de lo que tienes \(tienes 6 unidades\)/], ['6,01', /No puedes usar más/]]) {
  await fu.getByRole('textbox').fill(valor)
  await fu.getByRole('button', { name: 'Descontar' }).click()
  const e = await errorsDe(fu)
  ok(e.length === 1 && patron.test(e[0]), `Usé "${valor}": rechazado → "${e[0]}"`, e.join(' | '))
}
ok(/6 unidades/.test(await texto(huevos)), 'Tras los intentos inválidos, huevos sigue en 6 unidades')
await fu.getByRole('textbox').fill('2')
await fu.getByRole('button', { name: 'Descontar' }).click()
ok(/4 unidades/.test(await texto(huevos)) && (await mensaje()).includes('Cantidad descontada'), 'Usé 2: quedan 4 unidades + mensaje')
await recargar()
ok(/4 unidades/.test(await texto(page.locator('li[data-id="seed-huevos"]'))), 'RECARGA tras "usé": persisten 4 unidades')

await page.locator('li[data-id="seed-huevos"]').getByRole('button', { name: 'Usé Huevos' }).click()
await page.getByRole('form', { name: 'Usar Huevos' }).getByRole('textbox').fill('4')
await page.getByRole('form', { name: 'Usar Huevos' }).getByRole('button', { name: 'Descontar' }).click()
ok((await cuantas('Huevos')) === 0 && (await mensaje()).includes('Usaste todo'), 'Usé todo (llega a 0): el lote se ELIMINA y avisa')
await recargar()
ok((await cuantas('Huevos')) === 0, 'RECARGA: el lote agotado no vuelve')
await page.click('text=Recetas')
ok((await page.getAttribute('[data-receta="Huevos pericos"]', 'data-estado')) === 'parcial', 'Sin huevos, Huevos pericos pasa a parcial')
await page.click('nav >> text=Despensa')

// ───────── 6. BORRAR con confirmación propia ─────────
const queso = () => page.locator('li[data-id="seed-queso"]')
await queso().getByRole('button', { name: 'Borrar Queso' }).click()
ok(await page.getByRole('alertdialog', { name: /Confirmar borrado de Queso/ }).isVisible(), 'Borrar: aparece la confirmación DENTRO de la app')
await page.getByRole('button', { name: 'Cancelar' }).click()
ok((await queso().count()) === 1, 'Cancelar: el queso sigue')
await queso().getByRole('button', { name: 'Borrar Queso' }).click()
await page.getByRole('button', { name: 'Sí, borrar' }).click()
ok((await queso().count()) === 0 && (await mensaje()).includes('Queso borrado'), 'Confirmar: el queso se borra + mensaje')
await recargar()
ok((await queso().count()) === 0, 'RECARGA tras borrar: sigue borrado')
ok(dialogos === 0, 'Ningún window.alert/confirm/prompt en todo el flujo', String(dialogos))

// ───────── 7. ESTADO VACÍO + "cargar datos de ejemplo" con fechas de HOY ─────────
let guardia = 0
while ((await page.locator('li[data-nombre]').count()) > 0 && guardia++ < 30) {
  const li = page.locator('li[data-nombre]').first()
  const nombre = await li.getAttribute('data-nombre')
  await li.getByRole('button', { name: `Borrar ${nombre}` }).click()
  await page.getByRole('button', { name: 'Sí, borrar' }).click()
}
await page.waitForSelector('[data-testid=estado-vacio]')
const vacio = await page.textContent('[data-testid=estado-vacio]')
ok(/Tu despensa está vacía/.test(vacio) && /Agregar ingrediente/.test(vacio) && /Cargar datos de ejemplo/.test(vacio), 'Borrar todo: estado vacío con mensaje útil y los 2 botones', vacio)
await page.screenshot({ path: `${SHOTS}/f3-vacio-360.png`, fullPage: true })
await recargar()
ok(await page.locator('[data-testid=estado-vacio]').isVisible(), 'RECARGA: la despensa vacía persiste (no vuelve el seed)')
await page.click('text=Recetas')
ok((await page.locator('[data-testid=lista-parciales] > li').count()) === 12 && (await page.locator('[data-testid=lista-cocinables]').count()) === 0, 'Recetas con despensa vacía: 12 parciales, 0 cocinables')
await page.click('nav >> text=Despensa')

// avanzar 10 días con la pestaña abierta; "cargar ejemplo" debe usar las fechas de ESE día, no las guardadas
await page.clock.fastForward(10 * 24 * 3600 * 1000) // 25/03/2026
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click()
await page.waitForSelector('[data-testid=resumen]')
const primero = await texto(page.locator('[data-testid=lista-vigentes] li'))
ok(/Pollo/.test(primero) && /vence hoy/.test(primero) && /25\/03\/2026/.test(primero), 'Cargar ejemplo: el Pollo vence HOY (25/03/2026), fechas relativas al día actual', primero)
const resumen = await page.textContent('[data-testid=resumen]')
ok(/9 registros/.test(resumen) && /4 por vencer/.test(resumen) && /2 vencidos/.test(resumen), 'Cargar ejemplo: 9 registros · 4 por vencer · 2 vencidos', resumen)
ok(/fechas de hoy/.test(await mensaje()), 'Cargar ejemplo: mensaje de confirmación')
await recargar()
ok(/25\/03\/2026/.test(await texto(page.locator('[data-testid=lista-vigentes] li'))) && (await registros()) === 9, 'RECARGA: los datos de ejemplo persisten')
await page.screenshot({ path: `${SHOTS}/f3-despensa-360.png`, fullPage: true })

ok(errores.length === 0, 'Sin errores en consola ni excepciones', errores.join(' | '))
await browser.close()
console.log(`\n${fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'}`)
process.exit(fallos === 0 ? 0 : 1)
