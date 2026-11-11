// Pruebas de navegador de la corrección de la auditoría cruzada (AC-1, AC-3, AC-4, AC-5, AC-7).
// Requiere: servidor en marcha (npm run dev) y "npm install --no-save playwright-core" (NO es dependencia del proyecto).
// Uso: node scripts/e2e-fase5.mjs [AC-1 AC-3 ...]   Variables: URL, EDGE_PATH
import { chromium } from 'playwright-core'

const URL = process.env.URL ?? 'http://localhost:5173/'
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const SOLO = process.argv.slice(2)
const HOY = new Date(2026, 2, 15, 10, 0, 0)
const f = (n) => {
  const d = new Date(2026, 2, 15 + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

let fallos = 0
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'OK  ' : 'FALLA'}  ${msg}${cond ? '' : '  → ' + extra}`)
  if (!cond) fallos++
}
const corre = (id) => SOLO.length === 0 || SOLO.includes(id)

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const nuevo = async (storage) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, locale: 'es-CO' })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.clock.install({ time: HOY })
  if (storage !== undefined) {
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem('__i')) { localStorage.setItem('foodsaver:v1', s); sessionStorage.setItem('__i', '1') }
    }, storage)
  }
  await page.goto(URL)
  await page.waitForSelector('[data-testid=resumen], [data-testid=estado-vacio]')
  return { ctx, page, errores }
}
const ls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('foodsaver:v1') || 'null'))
const registros = (page) => page.locator('li[data-id]').count()
const L = (fm, t) => fm.getByLabel(t, { exact: true })
const abrirAgregar = async (page) => {
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  return page.getByRole('form', { name: 'Agregar ingrediente' })
}
const llenarYogur = async (fm, nombre = 'Yogur') => {
  await L(fm, 'Nombre').fill(nombre)
  await L(fm, 'Cantidad').fill('2')
  await L(fm, 'Fecha de vencimiento').fill(f(5))
}

// ───────── AC-1: un segundo Enter durante el cierre no repite la acción ─────────
if (corre('AC-1')) {
  console.log('\n# AC-1 · doble envío por teclado')
  let { page, ctx } = await nuevo()
  let fm = await abrirAgregar(page)
  await llenarYogur(fm)
  await L(fm, 'Nombre').focus()
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  ok((await page.locator('li[data-nombre="Yogur"]').count()) === 1, 'Agregar con Enter doble: un solo lote de Yogur', String(await page.locator('li[data-nombre="Yogur"]').count()))
  await ctx.close()

  ;({ page, ctx } = await nuevo())
  await page.locator('li[data-id="seed-huevos"] button.banda').click()
  await page.getByRole('button', { name: 'Usé Huevos' }).click()
  await page.getByLabel(/¿Cuánto usaste/).fill('1')
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  const huevos = (await ls(page)).ingredientes.find((i) => i.id === 'seed-huevos').cantidad
  ok(huevos === 5, 'Usé 1 de 6 huevos con Enter doble: quedan 5', String(huevos))
  await ctx.close()

  ;({ page, ctx } = await nuevo())
  fm = await abrirAgregar(page)
  await llenarYogur(fm)
  await fm.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.waitForTimeout(40) // la hoja ya está cerrándose
  const inerte = await page.evaluate(() => {
    const h = document.querySelector('.hoja')
    return h ? h.hasAttribute('inert') : true
  })
  ok(inerte, 'Mientras la hoja se cierra, queda inerte (también para el teclado)')
  await ctx.close()
}

// ───────── AC-3: otra pestaña cambia los datos ─────────
if (corre('AC-3')) {
  console.log('\n# AC-3 · dos pestañas')
  const { page, ctx } = await nuevo()
  const p2 = await ctx.newPage()
  await p2.clock.install({ time: HOY })
  await p2.goto(URL); await p2.waitForSelector('[data-testid=resumen]')
  const agregar = async (pg, n) => {
    const fm = await abrirAgregar(pg)
    await L(fm, 'Nombre').fill(n); await L(fm, 'Cantidad').fill('1'); await L(fm, 'Fecha de vencimiento').fill(f(9))
    await fm.getByRole('button', { name: 'Guardar', exact: true }).click()
    await pg.waitForTimeout(400)
  }
  await agregar(page, 'DesdeA')
  await p2.waitForTimeout(300)
  ok((await p2.locator('li[data-nombre="DesdeA"]').count()) === 1, 'La pestaña B ve lo que agregó la A sin recargar')
  await agregar(p2, 'DesdeB')
  const nombres = (await ls(page)).ingredientes.map((i) => i.nombre).filter((n) => n.startsWith('Desde')).sort()
  ok(JSON.stringify(nombres) === '["DesdeA","DesdeB"]', 'Lo guardado conserva lo de las dos pestañas', nombres.join(','))
  await page.waitForTimeout(300)
  ok((await page.locator('li[data-nombre="DesdeB"]').count()) === 1, 'La pestaña A ve lo que agregó la B')
  await ctx.close()
}

// ───────── AC-4: cerrar con datos sin guardar pide confirmación ─────────
if (corre('AC-4')) {
  console.log('\n# AC-4 · descartar lo escrito')
  const { page, ctx } = await nuevo()
  const hojaAbierta = async () => (await page.locator('.hoja').count()) > 0
  const confirmacion = () => page.getByText('¿Descartar lo escrito?')

  let fm = await abrirAgregar(page)
  await page.keyboard.press('Escape')
  await page.locator('.hoja').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {})
  ok(!(await hojaAbierta()), 'Sin cambios, Escape cierra directo')

  for (const via of ['Escape', 'fondo', 'X']) {
    fm = await abrirAgregar(page)
    await L(fm, 'Nombre').fill('A medio escribir')
    if (via === 'Escape') await page.keyboard.press('Escape')
    else if (via === 'fondo') await page.mouse.click(180, 30)
    else await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await page.waitForTimeout(350)
    ok((await hojaAbierta()) && (await confirmacion().count()) === 1, `Con cambios, ${via} pide confirmación y no cierra`)
    const foco = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    ok(foco === 'Seguir editando', `El foco queda en "Seguir editando" (${via})`, foco)
    await page.getByRole('button', { name: 'Seguir editando' }).click()
    ok((await confirmacion().count()) === 0 && (await L(fm, 'Nombre').inputValue()) === 'A medio escribir', 'Seguir editando conserva lo escrito', await L(fm, 'Nombre').inputValue())
    const focoCampo = await page.evaluate(() => document.activeElement?.tagName)
    ok(focoCampo === 'INPUT', 'Al seguir editando el foco vuelve a un campo', focoCampo)
    await page.keyboard.press('Escape'); await page.waitForTimeout(250)
    await page.getByRole('button', { name: 'Descartar', exact: true }).click()
    await page.locator('.hoja').waitFor({ state: 'detached', timeout: 2000 }).catch(() => {})
    ok(!(await hojaAbierta()), `Descartar (${via}) cierra la hoja`)
    ok((await page.locator('li[data-nombre="A medio escribir"]').count()) === 0, 'Lo descartado no se guardó')
  }

  // Usé con cantidad escrita
  await page.locator('li[data-id="seed-huevos"] button.banda').click()
  await page.getByRole('button', { name: 'Usé Huevos' }).click()
  await page.getByLabel(/¿Cuánto usaste/).fill('1')
  await page.keyboard.press('Escape'); await page.waitForTimeout(250)
  ok((await confirmacion().count()) === 1, 'En "Usé" con cantidad escrita también pide confirmación')
  await ctx.close()
}

// ───────── AC-5: un registro inválido no tira los demás ─────────
if (corre('AC-5')) {
  console.log('\n# AC-5 · descartar solo lo inválido')
  const datos = { version: 1, ingredientes: [
    { id: 'a', nombre: 'Lentejas', cantidad: 500, unidad: 'g', vence: f(40) },
    { id: 'b', nombre: 'Panela', cantidad: 100001, unidad: 'g', vence: f(40) },
    { id: 'c', nombre: 'Aguacate', cantidad: 2, unidad: 'unidad', vence: f(2) }] }
  const { page, ctx } = await nuevo(JSON.stringify(datos))
  const nombres = await page.locator('li[data-nombre]').evaluateAll((l) => l.map((e) => e.dataset.nombre))
  ok(nombres.length === 2 && nombres.includes('Lentejas') && nombres.includes('Aguacate'), 'Quedan los 2 registros válidos (sin seed)', nombres.join(','))
  const aviso = (await page.locator('[role=alert]').first().textContent().catch(() => '')) ?? ''
  ok(/1 registro/.test(aviso), 'El aviso dice cuántos se descartaron', aviso)
  const respaldo = await page.evaluate(() => localStorage.getItem('foodsaver:v1:respaldo'))
  ok(!!respaldo && respaldo.includes('Panela'), 'Se guardó copia de los datos originales')
  await ctx.close()
}

// ───────── AC-7: ids repetidos ─────────
if (corre('AC-7')) {
  console.log('\n# AC-7 · ids duplicados')
  const datos = { version: 1, ingredientes: [
    { id: 'x', nombre: 'Lentejas', cantidad: 500, unidad: 'g', vence: f(40) },
    { id: 'x', nombre: 'Aguacate', cantidad: 2, unidad: 'unidad', vence: f(2) }] }
  const { page, ctx } = await nuevo(JSON.stringify(datos))
  ok((await registros(page)) === 2, 'Se conservan los 2 registros')
  await page.locator('li[data-nombre="Aguacate"] button.banda').click()
  const titulo = await page.locator('.hoja h2').textContent()
  ok(titulo === 'Aguacate', 'Tocar Aguacate abre Aguacate (no Lentejas)', titulo ?? '')
  await page.getByRole('button', { name: 'Borrar Aguacate' }).click()
  await page.getByRole('button', { name: 'Sí, borrar' }).click()
  await page.waitForTimeout(500)
  const quedan = await page.locator('li[data-nombre]').evaluateAll((l) => l.map((e) => e.dataset.nombre))
  ok(quedan.length === 1 && quedan[0] === 'Lentejas', 'Borrar Aguacate deja solo Lentejas', quedan.join(','))
  await ctx.close()
}

await browser.close()
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLO(S)`)
process.exit(fallos === 0 ? 0 : 1)
