// Verifica el DISEÑO de la Fase 4 sobre el CSS ya renderizado en un navegador real: paleta, tipografía, anatomía de la
// línea de tiempo, contraste calculado, objetivos táctiles, movimiento, reduced-motion, sticky y que la demo no
// dependa de internet. Ver DISENO.md.
// Requiere: servidor en marcha (npm run dev) y "npm install --no-save playwright-core" (NO es dependencia del proyecto).
// Uso: node scripts/e2e-fase4.mjs   Variables: URL, EDGE_PATH
import { chromium } from 'playwright-core'

const URL = process.env.URL ?? 'http://localhost:5173/'
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

let fallos = 0
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'OK  ' : 'FALLA'}  ${msg}${cond ? '' : '  → ' + extra}`)
  if (!cond) fallos++
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const nuevoContexto = (opciones = {}) => browser.newContext({ viewport: { width: 360, height: 800 }, locale: 'es-CO', ...opciones })
const IR = (p, nombre) => p.getByRole('navigation', { name: 'Secciones' }).getByRole('button', { name: nombre }).click()

const TINTA = 'rgb(28, 20, 16)'
const CREMA = 'rgb(255, 243, 220)'
const AVISO = 'rgb(142, 31, 18)'
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

// ═════════ A. Carga, fuentes y red (la demo no depende de internet) ═════════
const ctx = await nuevoContexto()
const page = await ctx.newPage()
const errores = []
const peticiones = []
page.on('pageerror', (e) => errores.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
page.on('request', (r) => peticiones.push(r.url()))
await page.goto(URL)
await page.waitForSelector('[data-testid=resumen]')

// Animaciones en curso justo tras cargar: solo deben tocar transform y opacity
const propsAnimadas = await page.evaluate(() => {
  const estandar = new Set(['offset', 'easing', 'composite', 'computedOffset'])
  const props = new Set()
  const anims = document.getAnimations()
  for (const a of anims) for (const k of a.effect.getKeyframes()) for (const p of Object.keys(k)) if (!estandar.has(p)) props.add(p)
  return { cuantas: anims.length, props: [...props].sort() }
})
ok(propsAnimadas.cuantas > 5, `Hay animaciones de entrada en curso (${propsAnimadas.cuantas})`, JSON.stringify(propsAnimadas))
ok(propsAnimadas.props.every((p) => p === 'transform' || p === 'opacity'), 'Las animaciones SOLO animan transform y opacity', propsAnimadas.props.join(', '))

await page.waitForTimeout(1200)
const externas = peticiones.filter((u) => { try { return !['localhost', '127.0.0.1'].includes(new globalThis.URL(u).hostname) && !u.startsWith('data:') } catch { return false } })
ok(externas.length === 0, 'Ninguna petición a internet (fuentes empaquetadas con @fontsource)', externas.join(', '))
ok(peticiones.filter((u) => /\.woff2/.test(u)).length >= 2, 'Las fuentes se sirven desde el propio proyecto (.woff2)', peticiones.filter((u) => /woff/.test(u)).join(', '))
const fuentes = await page.evaluate(async () => {
  await document.fonts.ready
  return {
    titulo: document.fonts.check('800 24px "Bricolage Grotesque"'),
    texto: document.fonts.check('400 16px "Instrument Sans"'),
    h1: getComputedStyle(document.querySelector('h1')).fontFamily,
    cuerpo: getComputedStyle(document.body).fontFamily,
    usadas: [...new Set([...document.querySelectorAll('body *')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()))],
  }
})
ok(fuentes.titulo && fuentes.texto, 'Bricolage Grotesque 800 e Instrument Sans están cargadas', JSON.stringify(fuentes))
ok(/Bricolage/.test(fuentes.h1) && /Instrument Sans/.test(fuentes.cuerpo), 'Títulos en Bricolage, texto en Instrument Sans', `${fuentes.h1} | ${fuentes.cuerpo}`)
ok(!fuentes.usadas.some((f) => /^(Inter|Roboto|Arial)$/i.test(f)), 'Ni Inter, ni Roboto, ni Arial en ningún elemento', fuentes.usadas.join(', '))

// ═════════ B. Paleta y tipografía renderizadas ═════════
const estilo = (sel, props) => page.evaluate(([s, ps]) => { const e = document.querySelector(s); const c = getComputedStyle(e); return Object.fromEntries(ps.map((p) => [p, c[p]])) }, [sel, props])
const banda = (id) => `li[data-id="${id}"] button.banda`
const colores = {
  'seed-pollo': 'rgb(255, 107, 74)', 'seed-tomate': 'rgb(255, 143, 112)', 'seed-huevos': 'rgb(255, 197, 61)',
  'seed-queso': 'rgb(255, 217, 122)', 'seed-cebolla': 'rgb(191, 220, 74)', 'seed-harina': 'rgb(207, 229, 110)', 'seed-arroz': 'rgb(207, 229, 110)',
}
for (const [id, esperado] of Object.entries(colores)) {
  const c = await estilo(banda(id), ['backgroundColor', 'color'])
  ok(c.backgroundColor === esperado && c.color === TINTA, `Banda ${id.replace('seed-', '')}: color de la paleta y texto en tinta`, JSON.stringify(c))
}
for (const id of ['seed-leche', 'seed-arroz-vencido']) {
  const c = await estilo(banda(id), ['backgroundImage'])
  ok(/repeating-linear-gradient\(135deg/.test(c.backgroundImage) && /211, 201, 182/.test(c.backgroundImage) && /196, 185, 164/.test(c.backgroundImage),
    `Vencido ${id.replace('seed-', '')}: gris rayado 135° con #D3C9B6 y #C4B9A4`, c.backgroundImage.slice(0, 120))
}
ok((await estilo('body', ['backgroundColor'])).backgroundColor === CREMA, 'Fondo crema #FFF3DC')
const h1 = await estilo('h1', ['fontSize', 'fontWeight', 'letterSpacing'])
ok(h1.fontSize === '44px' && h1.fontWeight === '800' && Math.abs(parseFloat(h1.letterSpacing) + 0.03 * 44) < 0.2, 'Título "Despensa": 44 px, peso 800, tracking −0.03em', JSON.stringify(h1))
const nom1 = await estilo(`${banda('seed-pollo')} span span`, ['fontSize', 'fontWeight'])
const nom2 = await estilo(`${banda('seed-cebolla')} span span`, ['fontSize', 'fontWeight'])
ok(nom1.fontSize === '24px' && nom1.fontWeight === '800', 'Nombre en "Usar primero": Bricolage 800 a 24 px', JSON.stringify(nom1))
ok(nom2.fontSize === '18px', 'Nombre en secciones compactas ("Con tiempo"): 18 px', JSON.stringify(nom2))

// ═════════ C. Anatomía de la fila ═════════
const anat = await page.evaluate(() => {
  const li = document.querySelector('li[data-id="seed-tomate"]')
  const cols = getComputedStyle(li).gridTemplateColumns.split(' ')
  const tramo = getComputedStyle(li.querySelector('.tramo'))
  const nodo = li.querySelector('.nodo'); const n = getComputedStyle(nodo)
  const b = getComputedStyle(li.querySelector('.banda'))
  const lr = document.querySelector('li[data-id="seed-pollo"] .banda').getBoundingClientRect()
  return { col1: cols[0], tramoAncho: tramo.width, tramoFondo: tramo.backgroundColor, nodoW: n.width, nodoH: n.height, nodoBorde: n.borderTopWidth + ' ' + n.borderTopColor, nodoFondo: n.backgroundColor,
    radios: [b.borderTopLeftRadius, b.borderBottomLeftRadius, b.borderTopRightRadius], derecha: Math.round(lr.right), ancho: document.documentElement.clientWidth }
})
ok(anat.col1 === '50px', 'Columna de fecha de 50 px', anat.col1)
ok(anat.tramoAncho === '4px', 'Línea vertical de 4 px', anat.tramoAncho)
ok(anat.tramoFondo === 'rgb(255, 143, 112)', 'El tramo toma el color de SU banda (Tomate = coral claro)', anat.tramoFondo)
ok(anat.nodoW === '16px' && anat.nodoH === '16px' && anat.nodoFondo === 'rgb(255, 143, 112)' && /^2px/.test(anat.nodoBorde), 'Nodo de 16 px del color de la banda con aro de tinta de 2 px', JSON.stringify(anat))
ok(anat.radios[0] === '18px' && anat.radios[1] === '18px' && anat.radios[2] === '0px', 'Banda: esquina izquierda redondeada 18 px, derecha recta (a todo ancho)', anat.radios.join(' '))
ok(anat.derecha >= anat.ancho - 1, 'La banda llega al borde derecho de la pantalla', `${anat.derecha}/${anat.ancho}`)
const colorTramos = await page.$$eval('[data-testid=lista-usar-primero] li .tramo', (t) => t.map((e) => getComputedStyle(e).backgroundColor))
ok(new Set(colorTramos).size === 4, 'La línea cambia de color de tramo a tramo (coral → coral claro → mango → mango claro)', colorTramos.join(' | '))
const punteada = await page.$eval('[data-testid=lista-vencidos] li:first-child .tramo', (e) => getComputedStyle(e).backgroundImage)
ok(/repeating-linear-gradient/.test(punteada), 'En vencidos la línea es punteada', punteada.slice(0, 80))
const pulso = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('li[data-id="seed-pollo"] .nodo'), '::after'); return { n: c.animationName, d: c.animationDuration, it: c.animationIterationCount } })
ok(pulso.n === 'pulso' && pulso.it === 'infinite', 'El nodo de "Hoy" lleva un anillo que pulsa', JSON.stringify(pulso))
const pulsoOtro = await page.evaluate(() => getComputedStyle(document.querySelector('li[data-id="seed-tomate"] .nodo'), '::after').animationName)
ok(pulsoOtro === 'none', 'Solo el nodo de "Hoy" pulsa', pulsoOtro)
ok((await page.locator('li[data-id="seed-leche"] .nodo svg').count()) === 1 && (await page.locator('li[data-id="seed-tomate"] .nodo svg').count()) === 0, 'El nodo de los vencidos lleva una X')
const tachado = await estilo(`${banda('seed-leche')} span span`, ['textDecorationLine'])
const aviso = await page.$eval(`${banda('seed-leche')} > span:last-child`, (e) => ({ color: getComputedStyle(e).color, texto: e.textContent.trim() }))
ok(/line-through/.test(tachado.textDecorationLine), 'Vencidos: nombre tachado', JSON.stringify(tachado))
ok(aviso.color === AVISO && /^Hace 1 día$/i.test(aviso.texto), 'Vencidos: "Hace 1 día" en #8E1F12', JSON.stringify(aviso))
const textosBanda = await page.$$eval('li[data-id] button.banda > span:last-child', (e) => e.map((x) => x.textContent.trim()))
ok(textosBanda.join('|') === 'Hoy|Mañana|2 días|3 días|7 días|120 días|180 días|Hace 5 días|Hace 1 día', 'Texto relativo de cada banda', textosBanda.join('|'))
const sinIcono = await page.$$eval('li[data-id] button.banda', (b) => b.filter((x) => !x.querySelector('svg[aria-hidden=true]') || !x.textContent.trim()).length)
ok(sinIcono === 0, 'Cada estado lleva color + ÍCONO + TEXTO (ninguna banda sin ícono o sin texto)', String(sinIcono))
const fechas = await page.$$eval('li[data-id] .anim-fecha', (e) => e.map((x) => x.innerText.replace(/\s+/g, ' ').trim()))
ok(/^[A-Z]{3} \d{1,2}$/.test(fechas[0]), 'Columna izquierda: mes en mayúsculas pequeño y día', fechas.join(' | '))
ok(fechas.some((x) => /^[A-Z]{3} \d{1,2} 20\d\d$/.test(x)), 'La fecha lleva el AÑO si es distinto al actual', fechas.join(' | '))

// ═════════ D. Cabecera, resumen y navegación ═════════
const cab = await page.evaluate(() => {
  const r = document.querySelector('[data-testid=resumen]')
  const hijos = [...r.children].map((c) => c.getBoundingClientRect())
  const btn = [...document.querySelectorAll('header button')].find((b) => b.textContent.trim() === 'Agregar')
  const nav = document.querySelector('nav[aria-label=Secciones]'); const ns = getComputedStyle(nav)
  const botones = [...nav.querySelectorAll('button')]
  return {
    alto: r.getBoundingClientRect().height, mismaLinea: hijos.every((h) => Math.abs(h.top - hijos[0].top) < 2), texto: r.textContent,
    btnAlto: btn.getBoundingClientRect().height, btnFondo: getComputedStyle(btn).backgroundColor, btnColor: getComputedStyle(btn).color,
    navPos: ns.position, navFondo: ns.backgroundColor, navRadio: ns.borderTopLeftRadius, navBotones: botones.map((b) => ({ txt: b.textContent.trim(), svg: !!b.querySelector('svg[aria-hidden=true]'), cur: b.getAttribute('aria-current'), fondo: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color })),
  }
})
ok(cab.mismaLinea && cab.alto < 44, 'Resumen "N por vencer · N vencidos" en UNA línea a 360 px', JSON.stringify({ alto: cab.alto, mismaLinea: cab.mismaLinea }))
ok(/4 por vencer/.test(cab.texto) && /2 vencidos/.test(cab.texto), 'Resumen con los conteos correctos', cab.texto)
ok(cab.btnAlto >= 48 && cab.btnFondo === TINTA && cab.btnColor === CREMA, 'Botón "+ Agregar": 48 px de alto, de tinta con texto crema', JSON.stringify(cab))
ok(cab.navPos === 'fixed' && cab.navFondo === TINTA && parseFloat(cab.navRadio) > 20, 'Barra inferior flotante tipo píldora de tinta', JSON.stringify(cab))
ok(cab.navBotones.length === 2 && cab.navBotones.every((b) => b.svg && b.txt), 'Barra inferior: dos segmentos con ícono y texto', JSON.stringify(cab.navBotones))
ok(cab.navBotones[0].cur === 'page' && cab.navBotones[0].fondo === CREMA && cab.navBotones[0].color === TINTA && cab.navBotones[1].color === CREMA, 'Segmento activo en crema (aria-current=page); el otro, crema sobre tinta', JSON.stringify(cab.navBotones))

// ═════════ E. Contraste CALCULADO sobre el render real ═════════
const contraste = await page.evaluate(() => {
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number)
  const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const peores = []
  const medir = (nombre, fg, bg) => peores.push({ nombre, r: ratio(fg, bg) })
  for (const b of document.querySelectorAll('li[data-id] button.banda')) {
    const bgs = b.dataset.nivel === 'vencido' ? ['rgb(211, 201, 182)', 'rgb(196, 185, 164)'] : [getComputedStyle(b).backgroundColor]
    // nombre, cantidad y texto relativo (el de la derecha: hijo directo, en rojo de aviso si está vencido)
    for (const el of [b.querySelector(':scope > span:first-child > span:first-child'), b.querySelector(':scope > span:first-child > span:last-child'), b.querySelector(':scope > span:last-child')]) {
      for (const bg of bgs) medir(`${b.closest('li').dataset.id} ${el.textContent.trim().slice(0, 14)}`, getComputedStyle(el).color, bg)
    }
  }
  const sobreCrema = (sel) => { for (const e of document.querySelectorAll(sel)) medir(`crema: ${e.textContent.trim().slice(0, 18)}`, getComputedStyle(e).color, 'rgb(255, 243, 220)') }
  sobreCrema('h1'); sobreCrema('h2'); sobreCrema('header p')
  const nav = document.querySelector('nav[aria-label=Secciones]')
  for (const b of nav.querySelectorAll('button')) medir(`barra: ${b.textContent.trim()}`, getComputedStyle(b).color, getComputedStyle(b).backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(nav).backgroundColor : getComputedStyle(b).backgroundColor)
  const chip = document.querySelector('[data-testid=resumen] span')
  medir('chip por vencer', getComputedStyle(chip).color, getComputedStyle(chip).backgroundColor)
  peores.sort((a, b) => a.r - b.r)
  return { n: peores.length, peor: peores[0], malos: peores.filter((x) => x.r < 4.5) }
})
ok(contraste.malos.length === 0, `Contraste ≥ 4,5:1 en los ${contraste.n} pares de texto medidos (el peor: ${contraste.peor.nombre} = ${contraste.peor.r.toFixed(2)}:1)`, JSON.stringify(contraste.malos))

// ═════════ F. Objetivos táctiles, foco y etiquetas ═════════
const botonesChicos = async (p) => p.$$eval('button', (bs) => bs.filter((b) => b.offsetParent !== null).map((b) => ({ t: (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24), r: b.getBoundingClientRect() })).filter((x) => x.r.height < 44 || x.r.width < 44).map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`))
ok((await botonesChicos(page)).length === 0, 'Despensa: todos los botones miden al menos 44 px', (await botonesChicos(page)).join(', '))
await page.keyboard.press('Tab')
const foco = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return { estilo: c.outlineStyle, ancho: c.outlineWidth, tag: document.activeElement.tagName } })
ok(foco.estilo === 'solid' && parseFloat(foco.ancho) >= 3, 'Foco visible con teclado (contorno sólido de 3 px)', JSON.stringify(foco))
await page.getByRole('button', { name: 'Agregar', exact: true }).click()
ok((await botonesChicos(page)).length === 0, 'Hoja de agregar: todos los botones miden al menos 44 px', (await botonesChicos(page)).join(', '))
const hoja = await page.evaluate(() => { const h = document.querySelector('.hoja'); return { rol: h.getAttribute('role'), modal: h.getAttribute('aria-modal'), etiqueta: h.getAttribute('aria-label'), cerrar: !!h.querySelector('button[aria-label=Cerrar]') } })
ok(hoja.rol === 'dialog' && hoja.modal === 'true' && hoja.etiqueta === 'Agregar ingrediente' && hoja.cerrar, 'Hoja: role=dialog, aria-modal, nombre accesible y botón Cerrar con aria-label', JSON.stringify(hoja))
const sinEtiqueta = await page.$$eval('button', (bs) => bs.filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).length)
const svgsSueltos = await page.$$eval('svg', (s) => s.filter((x) => x.getAttribute('aria-hidden') !== 'true').length)
ok(sinEtiqueta === 0, 'Ningún botón solo de ícono sin aria-label', String(sinEtiqueta))
ok(svgsSueltos === 0, 'Todos los íconos decorativos con aria-hidden', String(svgsSueltos))
const labels = await page.$$eval('.hoja input, .hoja select', (c) => c.map((e) => !!document.querySelector(`label[for="${e.id}"]`) && document.querySelector(`label[for="${e.id}"]`).textContent.trim()))
ok(labels.length === 4 && labels.every(Boolean), 'Cada campo tiene etiqueta visible', JSON.stringify(labels))
const anchoConHoja = await page.evaluate(() => document.documentElement.scrollWidth)
ok(anchoConHoja <= 360, 'Sin scroll horizontal a 360 px con la hoja abierta', String(anchoConHoja))
const dur = await page.$eval('.hoja', (e) => { const c = getComputedStyle(e); return { n: c.animationName, d: c.animationDuration, f: c.animationTimingFunction } })
ok(dur.n === 'hoja-sube' && dur.d === '0.32s' && dur.f === EASE, 'Hoja: sube en 320 ms con el easing único', JSON.stringify(dur))
await page.keyboard.press('Escape')
await page.waitForTimeout(40)
const dur2 = await page.$eval('.hoja', (e) => { const c = getComputedStyle(e); return { n: c.animationName, d: c.animationDuration } })
ok(dur2.n === 'hoja-baja' && dur2.d === '0.2s', 'Hoja: al cerrar baja en 200 ms (más corta que la entrada)', JSON.stringify(dur2))
await page.locator('.hoja').waitFor({ state: 'detached' })

// ═════════ G. Movimiento: duración, easing, escalonado y revelado ═════════
const mov = await page.evaluate(() => {
  const i = (n) => getComputedStyle(document.querySelectorAll('[data-testid=lista-usar-primero] li .banda')[n])
  return { dur: i(0).animationDuration, ease: i(0).animationTimingFunction, nombre: i(0).animationName, delays: [0, 1, 2, 3].map((n) => i(n).animationDelay),
    nodo: getComputedStyle(document.querySelector('[data-testid=lista-usar-primero] li .nodo')).animationName, tramo: getComputedStyle(document.querySelector('[data-testid=lista-usar-primero] li .tramo')).animationName }
})
ok(mov.dur === '0.52s' && mov.nombre === 'entra-banda' && mov.ease === EASE, 'Bandas: entran en 520 ms con el easing único cubic-bezier(.22,1,.36,1)', JSON.stringify(mov))
ok(mov.delays.join() === '0s,0.06s,0.12s,0.18s', 'Escalonado de 60 ms entre bandas', mov.delays.join())
ok(mov.nodo === 'aparece-nodo' && mov.tramo === 'dibuja-tramo', 'Nodos aparecen con escala y los tramos se dibujan (scaleY)', JSON.stringify(mov))

// Escalonado: máximo 8 elementos (con 14 ingredientes el 9.º y el 14.º no se retrasan más que el 8.º)
await page.evaluate(() => {
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
  const ingredientes = Array.from({ length: 14 }, (_, k) => ({ id: `m${k}`, nombre: `Item ${k}`, cantidad: 1, unidad: 'unidad', vence: d(k % 4) }))
  localStorage.setItem('foodsaver:v1', JSON.stringify({ version: 1, ingredientes }))
})
await page.reload()
await page.waitForSelector('[data-testid=lista-usar-primero]')
for (let i = 0; i < 14; i++) {
  await page.locator('[data-testid=lista-usar-primero] li .banda').nth(i).scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
}
await page.waitForTimeout(500)
const retrasos = await page.$$eval('[data-testid=lista-usar-primero] li .banda', (b) => b.map((x) => getComputedStyle(x).animationDelay))
ok(retrasos.length === 14 && retrasos.slice(0, 8).join() === '0s,0.06s,0.12s,0.18s,0.24s,0.3s,0.36s,0.42s' && retrasos.slice(8).every((r) => r === '0s'),
  'Escalonado de 60 ms solo para los 8 primeros; del 9.º al 14.º no esperan', retrasos.join(' '))

// Encabezados de sección fijos (sticky) mientras se recorre su sección (con una lista larga para poder pasarlos)
const sticky = await page.evaluate(() => {
  const h = document.querySelector('#sec-usar-primero').closest('.encabezado-seccion')
  const sec = h.closest('section')
  window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + 500)
  return getComputedStyle(h).position
})
await page.waitForTimeout(250)
const topH = await page.$eval('#sec-usar-primero', (e) => Math.round(e.closest('.encabezado-seccion').getBoundingClientRect().top))
const scrolleado = await page.evaluate(() => Math.round(window.scrollY))
ok(sticky === 'sticky' && topH === 0 && scrolleado > 300, 'El encabezado de sección queda fijo (sticky) arriba mientras se recorre su sección', `${sticky} top=${topH} scrollY=${scrolleado}`)
await page.evaluate(() => window.scrollTo(0, 0))
await page.evaluate(() => localStorage.removeItem('foodsaver:v1'))
await page.reload()
await page.waitForSelector('[data-testid=resumen]')

// Revelado al entrar a pantalla: una sola vez
const antesDeBajar = await page.$eval('li[data-id="seed-leche"]', (e) => ({ visible: e.classList.contains('rev-visible'), opacidad: getComputedStyle(e.querySelector('.banda')).opacity }))
ok(antesDeBajar.visible === false && antesDeBajar.opacidad === '0', 'Las bandas fuera de pantalla esperan (invisibles) hasta entrar al viewport', JSON.stringify(antesDeBajar))
await page.evaluate(() => document.querySelector('li[data-id="seed-leche"]').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(900)
const despues = await page.$eval('li[data-id="seed-leche"]', (e) => ({ visible: e.classList.contains('rev-visible'), opacidad: getComputedStyle(e.querySelector('.banda')).opacity }))
ok(despues.visible && despues.opacidad === '1', 'Al entrar a pantalla se revela', JSON.stringify(despues))
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.evaluate(() => document.querySelector('li[data-id="seed-leche"]').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(100)
ok(await page.$eval('li[data-id="seed-leche"]', (e) => e.classList.contains('rev-visible') && getComputedStyle(e.querySelector('.banda')).opacity === '1'), 'Se revela UNA sola vez: al volver a salir y entrar no se oculta ni se repite')

// Pulsar: la banda se comprime scaleY(.96)
await page.evaluate(() => window.scrollTo(0, 0))
await page.locator(banda('seed-queso')).scrollIntoViewIfNeeded()
await page.waitForTimeout(150)
const caja = await page.locator(banda('seed-queso')).boundingBox()
await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
await page.mouse.down()
await page.waitForTimeout(160)
const presionada = await page.$eval(banda('seed-queso'), (e) => getComputedStyle(e).transform)
await page.mouse.move(5, 5)
await page.mouse.up()
ok(presionada === 'matrix(1, 0, 0, 0.96, 0, 0)', 'Al pulsar, la banda se comprime a scaleY(.96)', presionada)
const trans = await page.$eval(banda('seed-queso'), (e) => getComputedStyle(e).transitionDuration + ' ' + getComputedStyle(e).transitionProperty)
ok(trans === '0.1s transform', 'La compresión dura 100 ms y solo anima transform', trans)

// ═════════ H. Recetas ═════════
await IR(page, 'Recetas')
await page.waitForSelector('[data-testid=lista-cocinables]')
const rec = await page.evaluate(() => {
  const c = document.querySelector('[data-receta="Huevos pericos"]'); const p = document.querySelector('[data-receta="Arroz con leche"]')
  const mini = c.querySelector('ol[aria-label]')
  return {
    cocinable: getComputedStyle(c).backgroundColor, ancho: Math.round(c.getBoundingClientRect().width), vista: document.documentElement.clientWidth,
    parcial: getComputedStyle(p).backgroundImage.slice(0, 40), miniItems: mini ? [...mini.querySelectorAll('li')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()) : null,
    detallesAbierto: c.querySelector('details').open, resumenDetalle: c.querySelector('summary').textContent.trim(),
    titulos: [...document.querySelectorAll('h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()),
  }
})
ok(rec.cocinable === 'rgb(191, 220, 74)', 'Receta cocinable = bloque lima', rec.cocinable)
ok(rec.ancho >= rec.vista - 1, 'El bloque de receta es de todo el ancho de la pantalla', `${rec.ancho}/${rec.vista}`)
ok(/repeating-linear-gradient/.test(rec.parcial), '"No alcanza" = gris rayado', rec.parcial)
ok(JSON.stringify(rec.miniItems) === JSON.stringify(['Huevos · En 2 días', 'Tomate · Mañana']), '"Aprovecha lo que vence" usa la línea de tiempo en pequeño', JSON.stringify(rec.miniItems))
ok(rec.detallesAbierto === false && rec.resumenDetalle === 'Ver ingredientes y preparación', 'La preparación está plegada tras "Ver ingredientes y preparación"', JSON.stringify(rec))
ok(rec.titulos[0].startsWith('Puedes cocinar ahora') && rec.titulos[1].startsWith('No alcanza'), 'Secciones: "Puedes cocinar ahora" y "No alcanza"', rec.titulos.join(' | '))
const faltaMotivo = await page.$eval('[data-receta="Arroz con leche"]', (e) => ({ n: e.querySelectorAll('[data-motivo]').length, t: e.querySelector('[data-motivo]').textContent }))
ok(faltaMotivo.n === 1 && /vencido/.test(faltaMotivo.t), '"No alcanza" lista el faltante con su motivo', JSON.stringify(faltaMotivo))
ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 360, 'Recetas: sin scroll horizontal a 360 px')
ok((await botonesChicos(page)).length === 0 && (await page.$$eval('summary', (s) => s.every((x) => x.getBoundingClientRect().height >= 44))), 'Recetas: botones y "Ver ingredientes" de al menos 44 px')

// ═════════ I. Aviso de éxito: aria-live, no roba el foco, se retira a los 4 s ═════════
await IR(page, 'Despensa')
await ctx.close()
const ctxT = await nuevoContexto()
const pT = await ctxT.newPage()
await pT.clock.install({ time: new Date(2026, 2, 15, 10, 0, 0) })
await pT.goto(URL)
await pT.waitForSelector('[data-testid=resumen]')
await pT.getByRole('button', { name: 'Agregar', exact: true }).click()
const fT = pT.getByRole('form', { name: 'Agregar ingrediente' })
await fT.getByLabel('Nombre', { exact: true }).fill('Pera')
await fT.getByLabel('Cantidad', { exact: true }).fill('3')
await fT.getByLabel('Fecha de vencimiento', { exact: true }).fill('2026-03-20')
await fT.getByRole('button', { name: 'Guardar', exact: true }).click()
await pT.clock.runFor(300)
const toast = await pT.evaluate(() => { const r = document.querySelector('[role=status]'); const t = r.querySelector('.aviso-exito'); return { live: r.getAttribute('aria-live'), texto: t?.textContent.trim(), foco: !!document.activeElement?.closest('[role=status]'), anim: t && getComputedStyle(t).animationName } })
ok(toast.live === 'polite' && /Ingrediente guardado/.test(toast.texto ?? '') && toast.foco === false, 'Aviso de éxito: aria-live="polite", aparece y NO roba el foco', JSON.stringify(toast))
ok(toast.anim === 'aviso-entra', 'El aviso aparece desde abajo (animación aviso-entra)', toast.anim)
await pT.clock.runFor(3000) // 3,3 s en total
await pT.waitForTimeout(100)
ok((await pT.locator('.aviso-exito').count()) === 1 && (await pT.locator('.aviso-exito').getAttribute('data-saliendo')) === 'false', 'A los 3,3 s el aviso sigue visible')
await pT.clock.runFor(900) // 4,2 s en total: ya empezó a retirarse
await pT.waitForTimeout(100)
const saliendo = await pT.evaluate(() => { const t = document.querySelector('.aviso-exito'); return t ? { s: t.getAttribute('data-saliendo'), a: getComputedStyle(t).animationName, d: getComputedStyle(t).animationDuration } : null })
ok(saliendo === null || (saliendo.s === 'true' && saliendo.a === 'aviso-sale' && saliendo.d === '0.2s'), 'A los 4,2 s el aviso se está retirando (salida de 200 ms)', JSON.stringify(saliendo))
await pT.clock.runFor(600) // 4,8 s
await pT.waitForTimeout(100)
ok((await pT.locator('.aviso-exito').count()) === 0, 'A los 4,8 s el aviso se retiró solo, sin que nadie lo cierre')
await ctxT.close()

// ═════════ J. prefers-reduced-motion ═════════
const ctxR = await nuevoContexto({ reducedMotion: 'reduce' })
const pR = await ctxR.newPage()
await pR.goto(URL)
await pR.waitForSelector('[data-testid=resumen]')
await pR.waitForTimeout(300)
const red = await pR.evaluate(() => {
  const b = getComputedStyle(document.querySelector('li[data-id="seed-pollo"] .banda'))
  const nodo = getComputedStyle(document.querySelector('li[data-id="seed-pollo"] .nodo'), '::after')
  const keyframes = document.getAnimations().flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))
  return { banda: b.animationName, dur: b.animationDuration, delay: b.animationDelay, pulsoDisplay: nodo.display, pulsoAnim: nodo.animationName, props: [...new Set(keyframes)] }
})
ok(red.banda === 'fundido' && red.dur === '0.15s' && red.delay === '0s', 'Movimiento reducido: las bandas solo hacen un fundido corto (150 ms, sin retraso)', JSON.stringify(red))
ok(red.pulsoDisplay === 'none' || red.pulsoAnim === 'none', 'Movimiento reducido: el pulso del nodo "Hoy" se apaga', JSON.stringify(red))
ok(red.props.every((p) => p === 'opacity'), 'Movimiento reducido: solo se anima la opacidad (sin desplazamientos)', red.props.join(', '))
await pR.getByRole('button', { name: 'Agregar', exact: true }).click()
const hr = await pR.$eval('.hoja', (e) => ({ n: getComputedStyle(e).animationName, d: getComputedStyle(e).animationDuration }))
ok(hr.n === 'fundido' && hr.d === '0.15s', 'Movimiento reducido: la hoja aparece con un fundido, no sube', JSON.stringify(hr))
await ctxR.close()

// ═════════ K. Sin emojis ni textos en inglés visibles ═════════
const ctxE = await nuevoContexto()
const pE = await ctxE.newPage()
await pE.goto(URL)
await pE.waitForSelector('[data-testid=resumen]')
const emojis = await pE.evaluate(() => (document.body.innerText.match(/\p{Extended_Pictographic}/gu) || []).join(''))
ok(emojis === '', 'Ningún emoji en la interfaz (los íconos son SVG)', emojis)
ok((await pE.evaluate(() => document.documentElement.lang)) === 'es', 'Idioma del documento: es')
await ctxE.close()

ok(errores.length === 0, 'Sin errores en consola ni excepciones', errores.join(' | '))
await browser.close()
console.log(`\n${fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'}`)
process.exit(fallos === 0 ? 0 : 1)
