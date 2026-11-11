// Prueba de navegador con la INTERFAZ REAL (Edge/Chrome con Playwright): agregar, editar, "usé" y borrar,
// recargando después de cada una; validaciones hostiles; estado vacío y "cargar ejemplo"; y la hoja inferior
// (foco atrapado, Escape, retorno del foco, clic fuera). Actualizado en la Fase 4 al rediseño.
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
const registros = () => page.locator('li[data-id]').count()
const enListas = (extra) => page.locator(`[data-testid=lista-usar-primero] ${extra}, [data-testid=lista-con-tiempo] ${extra}`)
const recargar = async () => { await page.reload(); await page.waitForSelector('[data-testid=resumen], [data-testid=estado-vacio]') }
const mensaje = () => page.locator('[role=status]').textContent()
const irA = (nombre) => page.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: nombre }).click()
const esperarCierre = () => page.locator('.hoja').waitFor({ state: 'detached' })
const dentroDeLaHoja = () => page.evaluate(() => !!document.activeElement?.closest('.hoja'))
const botonAgregar = () => page.getByRole('button', { name: 'Agregar', exact: true })

// Toda acción sobre un ingrediente parte de tocar su banda: abre la hoja de opciones.
const abrirOpciones = async (id) => {
  await page.locator(`li[data-id="${id}"] button.banda`).click()
  await page.getByRole('dialog', { name: /^Opciones de / }).waitFor()
}
const accion = async (id, etiqueta, nombre) => {
  await abrirOpciones(id)
  await page.getByRole('button', { name: `${etiqueta} ${nombre}` }).click()
}
const abrirAgregar = async () => {
  await botonAgregar().click()
  return page.getByRole('form', { name: 'Agregar ingrediente' })
}
const llenar = async (form, { nombre, cantidad, unidad, vence }) => {
  if (nombre !== undefined) await form.getByLabel('Nombre', { exact: true }).fill(nombre)
  if (cantidad !== undefined) await form.getByLabel('Cantidad', { exact: true }).fill(cantidad)
  if (unidad !== undefined) await form.getByLabel('Unidad', { exact: true }).selectOption(unidad)
  if (vence !== undefined) await form.getByLabel('Fecha de vencimiento', { exact: true }).fill(vence)
}
const errorsDe = async (form) => form.locator('[role=alert]').allTextContents()
const guardar = (form, nombre = 'Guardar') => form.getByRole('button', { name: nombre, exact: true }).click()

await page.goto(URL)
await page.waitForSelector('[data-testid=resumen]')
ok((await registros()) === 9, 'Inicio: seed de 9 registros')

// ───────── 0. LA HOJA INFERIOR: foco, Escape, clic fuera ─────────
await abrirOpciones('seed-pollo')
ok(await dentroDeLaHoja(), 'Hoja: al abrirse, el foco queda DENTRO de ella')
const dlg = page.getByRole('dialog', { name: 'Opciones de Pollo' })
ok(await dlg.isVisible(), 'Hoja de opciones: role=dialog con nombre "Opciones de Pollo"')
ok((await dlg.getByRole('button', { name: /^(Usé|Editar|Borrar) Pollo$/ }).count()) === 3, 'Opciones de un ingrediente vigente: Usé, Editar y Borrar')
await page.keyboard.press('Escape')
await esperarCierre()
ok(await page.evaluate(() => { const a = document.activeElement; return a?.classList.contains('banda') && a.closest('li')?.dataset.id === 'seed-pollo' }),
  'Escape cierra la hoja y el foco VUELVE a la banda que la abrió')

await abrirOpciones('seed-arroz-vencido')
const dlgV = page.getByRole('dialog', { name: /^Opciones de Arroz/ })
ok((await dlgV.getByRole('button', { name: /^Usé / }).count()) === 0 && (await dlgV.getByRole('button', { name: /^Editar / }).count()) === 1 && (await dlgV.getByRole('button', { name: /^Borrar / }).count()) === 1,
  'Un vencido NO ofrece "Usé" (solo Editar y Borrar)')
await page.mouse.click(10, 10) // clic en el fondo oscuro
await esperarCierre()
ok(await page.evaluate(() => document.activeElement?.closest('li')?.dataset.id === 'seed-arroz-vencido'), 'Clic fuera cierra la hoja y devuelve el foco a la banda')

let form = await abrirAgregar()
ok(await dentroDeLaHoja() && (await form.getByLabel('Nombre', { exact: true }).evaluate((e) => e === document.activeElement)), 'Agregar: el foco entra al primer campo')
let afuera = 0
for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); if (!(await dentroDeLaHoja())) afuera++ }
for (let i = 0; i < 14; i++) { await page.keyboard.press('Shift+Tab'); if (!(await dentroDeLaHoja())) afuera++ }
ok(afuera === 0, 'Foco ATRAPADO: 14 Tab y 14 Shift+Tab seguidos, el foco nunca sale de la hoja', `${afuera} veces fuera`)
await page.keyboard.press('Escape')
await esperarCierre()
ok(await page.evaluate(() => document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent.trim() === 'Agregar'), 'Escape: el foco vuelve al botón "Agregar" que abrió la hoja')

// ───────── 1. AGREGAR (R1) con "2,5" y recarga ─────────
form = await abrirAgregar()
await llenar(form, { nombre: 'Yogur', cantidad: '2,5', unidad: 'l', vence: f(5) })
await guardar(form)
ok((await mensaje()).includes('Ingrediente guardado'), 'Agregar: mensaje de confirmación (aria-live)')
await esperarCierre()
ok((await cuantas('Yogur')) === 1 && /2,5 l/.test(await texto(fila('Yogur'))), 'Agregar: "2,5" se acepta y se muestra como 2,5 l', await texto(fila('Yogur')))
ok((await registros()) === 10, 'Agregar: ahora son 10 registros')
await recargar()
ok((await cuantas('Yogur')) === 1 && (await registros()) === 10 && /2,5 l/.test(await texto(fila('Yogur'))), 'RECARGA tras agregar: Yogur 2,5 l persiste (10 registros)')

// ───────── 2. Nombre repetido = otro lote ─────────
form = await abrirAgregar()
await llenar(form, { nombre: '  tomate ', cantidad: '3', unidad: 'unidad', vence: f(9) })
await guardar(form)
await esperarCierre()
const tomates = await page.locator('li[data-nombre]').evaluateAll((l) => l.filter((e) => e.dataset.nombre.trim().toLowerCase() === 'tomate').length)
ok(tomates === 2, 'Nombre repetido: hay 2 lotes de tomate (no se fusiona ni se rechaza)', String(tomates))
ok(/Tomate/.test(await texto(page.locator('li[data-nombre="  tomate "], li[data-nombre="tomate"]'))), 'El nombre guardado en minúscula se MUESTRA capitalizado ("Tomate")')
await recargar()
ok((await page.locator('li[data-nombre]').evaluateAll((l) => l.filter((e) => e.dataset.nombre.trim().toLowerCase() === 'tomate').length)) === 2, 'RECARGA: siguen los 2 lotes de tomate')

// ───────── 3. VALIDACIONES HOSTILES en el formulario (R3) ─────────
form = await abrirAgregar()
await guardar(form) // todo vacío
let errs = await errorsDe(form)
ok(errs.length === 3 && /nombre es obligatorio/.test(errs[0]) && /cantidad es obligatoria/.test(errs[1]) && /fecha de vencimiento es obligatoria/.test(errs[2]),
  'Formulario vacío: 3 errores en español, uno bajo cada campo', errs.join(' | '))
ok(await form.getByLabel('Nombre', { exact: true }).evaluate((e) => e === document.activeElement), 'El foco va al primer campo con error')
ok((await form.getByLabel('Nombre', { exact: true }).getAttribute('aria-invalid')) === 'true', 'El campo con error tiene aria-invalid')
ok(await form.getByLabel('Nombre', { exact: true }).evaluate((e) => e.getAttribute('aria-describedby') === e.parentElement.querySelector('[role=alert]').id), 'El error está asociado al campo (aria-describedby)')
await page.screenshot({ path: `${SHOTS}/f3-errores-360.png` })

const antes = await registros()
const casosCantidad = [
  ['0', /mayor que 0/], ['-3', /mayor que 0/], ['abc', /número/], ['', /obligatoria/], ['1e9', /número/], ['1000000000', /demasiado grande/], ['Infinity', /número/],
]
for (const [valor, patron] of casosCantidad) {
  await llenar(form, { nombre: 'Prueba', cantidad: valor, unidad: 'g', vence: f(3) })
  await guardar(form)
  const e = await errorsDe(form)
  ok(e.length === 1 && patron.test(e[0]), `Cantidad "${valor}": error claro bajo el campo → "${e[0]}"`, e.join(' | '))
}
ok((await registros()) === antes, 'Ninguna cantidad inválida agregó un registro')
await llenar(form, { nombre: 'x'.repeat(200), cantidad: '1', unidad: 'g', vence: f(3) })
await guardar(form)
errs = await errorsDe(form)
ok(errs.length === 1 && /muy largo \(máximo 60/.test(errs[0]), 'Nombre de 200 caracteres: rechazado con mensaje del máximo', errs.join(' | '))
await llenar(form, { nombre: 'x'.repeat(60), cantidad: '1', vence: '' })
await guardar(form)
errs = await errorsDe(form)
ok(errs.length === 1 && /fecha de vencimiento es obligatoria/.test(errs[0]), 'Fecha vacía: error bajo la fecha', errs.join(' | '))
ok((await registros()) === antes, 'Tampoco se agregó por nombre largo ni fecha vacía')
await llenar(form, { nombre: 'Pan viejo', cantidad: '1', unidad: 'unidad', vence: f(-1) })
await guardar(form)
await esperarCierre()
ok((await page.locator('[data-testid=lista-vencidos] li[data-nombre="Pan viejo"]').count()) === 1, 'Fecha de ayer: se acepta y cae en "Ya vencieron"')
await recargar()
ok((await page.locator('[data-testid=lista-vencidos] li[data-nombre="Pan viejo"]').count()) === 1, 'RECARGA: "Pan viejo" sigue en "Ya vencieron"')
ok(dialogos === 0, 'Ningún alert/confirm del navegador hasta ahora', String(dialogos))

// ───────── 4. EDITAR (R1) ─────────
await accion('seed-tomate', 'Editar', 'Tomate')
let fe = page.getByRole('form', { name: 'Editar Tomate' })
ok((await fe.getByLabel('Cantidad', { exact: true }).inputValue()) === '4' && (await fe.getByLabel('Nombre', { exact: true }).inputValue()) === 'Tomate', 'Editar: el formulario viene con los datos actuales')
await llenar(fe, { cantidad: '0' })
await guardar(fe, 'Guardar cambios')
errs = await errorsDe(fe)
ok(errs.length === 1 && /mayor que 0/.test(errs[0]), 'Editar con cantidad 0: error claro', errs.join(' | '))
await llenar(fe, { cantidad: '2,5', nombre: 'Tomate chonto' })
await guardar(fe, 'Guardar cambios')
ok((await mensaje()).includes('Cambios guardados'), 'Editar: mensaje de confirmación')
await esperarCierre()
ok(/2,5 unidades/.test(await texto(page.locator('li[data-id="seed-tomate"]'))) && (await cuantas('Tomate chonto')) === 1, 'Editar: la fila muestra Tomate chonto, 2,5 unidades')
await recargar()
ok(/2,5 unidades/.test(await texto(page.locator('li[data-id="seed-tomate"]'))) && (await cuantas('Tomate chonto')) === 1, 'RECARGA tras editar: persiste')

// editar un vencido para volverlo vigente (Leche +10 días) y ver que las recetas reaccionan
await irA('Recetas')
ok((await page.getAttribute('[data-receta="Arroz con leche"]', 'data-estado')) === 'parcial', 'Antes: Arroz con leche es parcial (leche vencida)')
await irA('Despensa')
await accion('seed-leche', 'Editar', 'Leche')
fe = page.getByRole('form', { name: 'Editar Leche' })
await llenar(fe, { vence: f(10) })
await guardar(fe, 'Guardar cambios')
await esperarCierre()
ok((await page.locator('[data-testid=lista-con-tiempo] li[data-nombre="Leche"]').count()) === 1, 'Editar fecha: Leche pasa de "Ya vencieron" a "Con tiempo"')
await recargar()
ok((await page.locator('[data-testid=lista-con-tiempo] li[data-nombre="Leche"]').count()) === 1, 'RECARGA: Leche sigue en "Con tiempo"')
await irA('Recetas')
ok((await page.getAttribute('[data-receta="Arroz con leche"]', 'data-estado')) === 'cocinable', 'Después: Arroz con leche ya es cocinable (las recetas reaccionan)')
await irA('Despensa')

// Escape durante la edición: cierra sin guardar y devuelve el foco
await accion('seed-cebolla', 'Editar', 'Cebolla')
await page.getByRole('form', { name: 'Editar Cebolla' }).getByLabel('Cantidad', { exact: true }).fill('99')
await page.keyboard.press('Escape')
await esperarCierre()
ok(/2 unidades/.test(await texto(page.locator('li[data-id="seed-cebolla"]'))), 'Escape en el formulario de edición: NO guarda lo escrito')

// ───────── 5. "USÉ" ─────────
await accion('seed-huevos', 'Usé', 'Huevos')
const fu = page.getByRole('form', { name: 'Usar Huevos' })
for (const [valor, patron] of [['0', /mayor que 0/], ['-1', /mayor que 0/], ['abc', /número/], ['', /obligatoria/], ['7', /No puedes usar más de lo que tienes \(tienes 6 unidades\)/], ['6,01', /No puedes usar más/]]) {
  await fu.getByRole('textbox').fill(valor)
  await fu.getByRole('button', { name: 'Descontar' }).click()
  const e = await errorsDe(fu)
  ok(e.length === 1 && patron.test(e[0]), `Usé "${valor}": rechazado → "${e[0]}"`, e.join(' | '))
}
await page.keyboard.press('Escape')
await esperarCierre()
ok(/6 unidades/.test(await texto(page.locator('li[data-id="seed-huevos"]'))), 'Tras los intentos inválidos, huevos sigue en 6 unidades')
await accion('seed-huevos', 'Usé', 'Huevos')
await fu.getByRole('textbox').fill('2')
await fu.getByRole('button', { name: 'Descontar' }).click()
ok((await mensaje()).includes('Cantidad descontada'), 'Usé 2: mensaje de confirmación')
await esperarCierre()
ok(/4 unidades/.test(await texto(page.locator('li[data-id="seed-huevos"]'))), 'Usé 2: quedan 4 unidades')
await recargar()
ok(/4 unidades/.test(await texto(page.locator('li[data-id="seed-huevos"]'))), 'RECARGA tras "usé": persisten 4 unidades')

await accion('seed-huevos', 'Usé', 'Huevos')
await fu.getByRole('textbox').fill('4')
await fu.getByRole('button', { name: 'Descontar' }).click()
await esperarCierre()
ok((await cuantas('Huevos')) === 0 && (await mensaje()).includes('Usaste todo'), 'Usé todo (llega a 0): el lote se ELIMINA y avisa')
ok(await page.evaluate(() => document.activeElement?.id === 'contenido-principal'), 'Si la banda ya no existe, el foco vuelve al contenido principal (no se pierde)')
await recargar()
ok((await cuantas('Huevos')) === 0, 'RECARGA: el lote agotado no vuelve')
await irA('Recetas')
ok((await page.getAttribute('[data-receta="Huevos pericos"]', 'data-estado')) === 'parcial', 'Sin huevos, Huevos pericos pasa a parcial')
await irA('Despensa')

// ───────── 6. BORRAR con confirmación propia ─────────
const queso = () => page.locator('li[data-id="seed-queso"]')
await accion('seed-queso', 'Borrar', 'Queso')
ok(await page.getByRole('alertdialog', { name: /Confirmar borrado de Queso/ }).isVisible(), 'Borrar: aparece la confirmación DENTRO de la app (alertdialog)')
await page.getByRole('button', { name: 'Cancelar' }).click()
await esperarCierre()
ok((await queso().count()) === 1, 'Cancelar: el queso sigue')
await accion('seed-queso', 'Borrar', 'Queso')
await page.getByRole('button', { name: 'Sí, borrar' }).click()
await esperarCierre()
ok((await queso().count()) === 0 && (await mensaje()).includes('Queso borrado'), 'Confirmar: el queso se borra + mensaje')
await recargar()
ok((await queso().count()) === 0, 'RECARGA tras borrar: sigue borrado')
ok(dialogos === 0, 'Ningún window.alert/confirm/prompt en todo el flujo', String(dialogos))

// ───────── 7. ESTADO VACÍO + "cargar datos de ejemplo" con fechas de HOY ─────────
let guardia = 0
while ((await page.locator('li[data-id]').count()) > 0 && guardia++ < 30) {
  await page.locator('li[data-id] button.banda').first().click()
  await page.getByRole('button', { name: /^Borrar / }).click()
  await page.getByRole('button', { name: 'Sí, borrar' }).click()
  await esperarCierre()
}
await page.waitForSelector('[data-testid=estado-vacio]')
const vacio = await page.textContent('[data-testid=estado-vacio]')
ok(/Tu despensa está vacía/.test(vacio) && /Agregar ingrediente/.test(vacio) && /Cargar datos de ejemplo/.test(vacio), 'Borrar todo: estado vacío con mensaje útil y los 2 botones', vacio)
await page.screenshot({ path: `${SHOTS}/f3-vacio-360.png` })
await recargar()
ok(await page.locator('[data-testid=estado-vacio]').isVisible(), 'RECARGA: la despensa vacía persiste (no vuelve el seed)')
await irA('Recetas')
ok((await page.locator('[data-testid=lista-parciales] > li').count()) === 12 && (await page.locator('[data-testid=lista-cocinables]').count()) === 0, 'Recetas con despensa vacía: 12 "No alcanza", 0 cocinables')
await irA('Despensa')

// avanzar 10 días con la pestaña abierta; "cargar ejemplo" debe usar las fechas de ESE día, no las guardadas
await page.clock.fastForward(10 * 24 * 3600 * 1000) // 25/03/2026
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click()
await page.waitForSelector('[data-testid=resumen]')
const primero = await texto(page.locator('[data-testid=lista-usar-primero] li'))
ok(/Pollo/.test(primero) && /Hoy/.test(primero) && /MAR\s*25/.test(primero), 'Cargar ejemplo: el Pollo vence HOY (MAR 25), fechas relativas al día actual', primero)
const resumen = await page.textContent('[data-testid=resumen]')
ok((await registros()) === 9 && /4 por vencer/.test(resumen) && /2 vencidos/.test(resumen), 'Cargar ejemplo: 9 registros · 4 por vencer · 2 vencidos', resumen)
ok(/fechas de hoy/.test(await mensaje()), 'Cargar ejemplo: mensaje de confirmación')
await recargar()
ok(/MAR\s*25/.test(await texto(page.locator('[data-testid=lista-usar-primero] li'))) && (await registros()) === 9, 'RECARGA: los datos de ejemplo persisten')

ok(errores.length === 0, 'Sin errores en consola ni excepciones', errores.join(' | '))
await browser.close()
console.log(`\n${fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'}`)
process.exit(fallos === 0 ? 0 : 1)
