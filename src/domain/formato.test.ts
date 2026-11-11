import { describe, expect, it } from 'vitest'
import { agruparPorUrgencia, capitalizarNombre, fechaCorta, nivelUrgencia, posicionEscalonada, textoRelativo, textoRelativoCorto } from './formato'
import { en, HOY, ing } from './pruebas-util'

describe('fechaCorta', () => {
  it('mes en mayúsculas y día sin cero a la izquierda', () => {
    expect(fechaCorta('2026-11-12', '2026-11-11')).toEqual({ mes: 'NOV', dia: '12' })
    expect(fechaCorta('2026-03-05', '2026-03-01')).toEqual({ mes: 'MAR', dia: '5' })
  })

  it('los 12 meses', () => {
    const meses = Array.from({ length: 12 }, (_, i) => fechaCorta(`2026-${String(i + 1).padStart(2, '0')}-01`, '2026-01-01').mes)
    expect(meses).toEqual(['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'])
  })

  it('NO agrega el año si es el actual', () => {
    expect('anio' in fechaCorta('2026-12-31', '2026-01-01')).toBe(false)
  })

  it('agrega el año si es distinto al actual (siguiente y anterior)', () => {
    expect(fechaCorta('2027-01-01', '2026-12-31')).toEqual({ mes: 'ENE', dia: '1', anio: '2027' })
    expect(fechaCorta('2025-12-31', '2026-01-01')).toEqual({ mes: 'DIC', dia: '31', anio: '2025' })
  })
})

describe('textoRelativo', () => {
  it.each([
    [0, 'Hoy'],
    [1, 'Mañana'],
    [2, 'En 2 días'],
    [3, 'En 3 días'],
    [180, 'En 180 días'],
    [-1, 'Hace 1 día'],
    [-2, 'Hace 2 días'],
    [-5, 'Hace 5 días'],
  ])('%i → "%s"', (dias, esperado) => {
    expect(textoRelativo(dias)).toBe(esperado)
  })

  it('singular solo con 1 día (hacia atrás), plural en el resto', () => {
    expect(textoRelativo(-1)).not.toMatch(/días/)
    expect(textoRelativo(-2)).toMatch(/días/)
  })
})

describe('textoRelativoCorto (banda)', () => {
  it.each([
    [0, 'Hoy'],
    [1, 'Mañana'],
    [2, '2 días'],
    [30, '30 días'],
    [-1, 'Hace 1 día'],
    [-5, 'Hace 5 días'],
  ])('%i → "%s"', (dias, esperado) => {
    expect(textoRelativoCorto(dias)).toBe(esperado)
  })
})

describe('capitalizarNombre (solo para mostrar)', () => {
  it.each([
    ['tomate', 'Tomate'],
    ['  tomate  ', 'Tomate'],
    ['harina de maíz', 'Harina de maíz'],
    ['Harina de maíz', 'Harina de maíz'],
    ['TOMATE', 'Tomate'],
    ['HARINA DE MAÍZ', 'Harina de maíz'],
    ['leche   entera', 'Leche entera'],
    ['ñame', 'Ñame'],
    ['ají Pique', 'Ají Pique'],
    ['', ''],
  ])('"%s" → "%s"', (entrada, esperado) => {
    expect(capitalizarNombre(entrada)).toBe(esperado)
  })

  it('no cambia cada palabra (a diferencia del capitalize de CSS)', () => {
    expect(capitalizarNombre('harina de maíz')).not.toBe('Harina De Maíz')
  })
})

describe('nivelUrgencia (color de la línea de tiempo)', () => {
  it.each([
    [-5, 'vencido'],
    [-1, 'vencido'],
    [0, 'hoy'],
    [1, 'manana'],
    [2, 'dos'],
    [3, 'tres'],
    [4, 'lejos'],
    [30, 'lejos'],
    [31, 'muy-lejos'],
    [180, 'muy-lejos'],
  ] as const)('%i días → %s', (dias, nivel) => {
    expect(nivelUrgencia(dias)).toBe(nivel)
  })
})

describe('agruparPorUrgencia (secciones de la despensa)', () => {
  const lista = [
    ing('Arroz', 500, 'g', en(180), 'a'),
    ing('Cebolla', 2, 'unidad', en(4), 'b'),
    ing('Queso', 250, 'g', en(3), 'c'),
    ing('Pollo', 500, 'g', HOY, 'd'),
    ing('Leche', 1, 'l', en(-1), 'e'),
    ing('Arroz viejo', 250, 'g', en(-5), 'f'),
    ing('Tomate', 4, 'unidad', en(1), 'g'),
  ]

  it('usar primero = 0 a 3 días; con tiempo = 4 o más; vencidos aparte', () => {
    const g = agruparPorUrgencia(lista, HOY)
    expect(g.usarPrimero.map((i) => i.id)).toEqual(['d', 'g', 'c'])
    expect(g.conTiempo.map((i) => i.id)).toEqual(['b', 'a'])
    expect(g.vencidos.map((i) => i.id)).toEqual(['f', 'e'])
  })

  it('el que vence hoy NO es vencido y el de 3 días entra en "usar primero", el de 4 no', () => {
    const g = agruparPorUrgencia(lista, HOY)
    expect(g.usarPrimero.map((i) => i.nombre)).toContain('Pollo')
    expect(g.usarPrimero.map((i) => i.nombre)).toContain('Queso')
    expect(g.usarPrimero.map((i) => i.nombre)).not.toContain('Cebolla')
  })

  it('cada elemento queda en exactamente una sección', () => {
    const g = agruparPorUrgencia(lista, HOY)
    expect(g.usarPrimero.length + g.conTiempo.length + g.vencidos.length).toBe(lista.length)
  })

  it('cambio de día: el mismo dato pasa de sección al cambiar hoy', () => {
    const queso = [ing('Queso', 250, 'g', en(3), 'c')]
    expect(agruparPorUrgencia(queso, HOY).usarPrimero).toHaveLength(1)
    expect(agruparPorUrgencia(queso, en(-1)).conTiempo).toHaveLength(1) // un día antes: faltaban 4
    expect(agruparPorUrgencia(queso, en(4)).vencidos).toHaveLength(1)
  })

  it('despensa vacía y no muta la entrada', () => {
    expect(agruparPorUrgencia([], HOY)).toEqual({ usarPrimero: [], conTiempo: [], vencidos: [] })
    const copia = lista.map((i) => i.id)
    agruparPorUrgencia(lista, HOY)
    expect(lista.map((i) => i.id)).toEqual(copia)
  })
})

describe('posicionEscalonada (entrada escalonada de las bandas)', () => {
  it('los 8 primeros conservan su posición (0 a 7)', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(posicionEscalonada)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('del 9.º en adelante no se retrasan (0), para no hacer esperar al que aparece al hacer scroll', () => {
    expect([8, 9, 20, 100].map(posicionEscalonada)).toEqual([0, 0, 0, 0])
  })

  it('un índice negativo no produce un retraso negativo', () => {
    expect(posicionEscalonada(-1)).toBe(0)
  })
})
