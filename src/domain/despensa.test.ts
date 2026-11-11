import { describe, expect, it } from 'vitest'
import { agregarIngrediente, cantidadDisponible, ordenarPorVencimiento, separarVencidos } from './despensa'
import { en, HOY, ing } from './pruebas-util'
import type { Ingrediente } from './tipos'

describe('ordenarPorVencimiento (R2)', () => {
  const lista = [
    ing('Arroz', 500, 'g', en(180)),
    ing('Tomate', 4, 'unidad', en(1)),
    ing('Leche', 1, 'l', en(-1)),
    ing('Pollo', 500, 'g', HOY),
  ]

  it('ordena de la fecha más cercana a la más lejana (vencidos primero)', () => {
    expect(ordenarPorVencimiento(lista).map((i) => i.nombre)).toEqual(['Leche', 'Pollo', 'Tomate', 'Arroz'])
  })

  it('no muta la lista original', () => {
    const copia = lista.map((i) => i.nombre)
    ordenarPorVencimiento(lista)
    expect(lista.map((i) => i.nombre)).toEqual(copia)
  })

  it('misma fecha: desempata por nombre sin importar tildes ni mayúsculas', () => {
    const r = ordenarPorVencimiento([
      ing('Zanahoria', 1, 'unidad', en(2)),
      ing('árbol de pan', 1, 'unidad', en(2)),
      ing('banano', 1, 'unidad', en(2)),
    ])
    expect(r.map((i) => i.nombre)).toEqual(['árbol de pan', 'banano', 'Zanahoria'])
  })

  it('compara fechas como fechas, no como texto (cruce de año)', () => {
    const r = ordenarPorVencimiento([ing('B', 1, 'g', '2027-01-02'), ing('A', 1, 'g', '2026-12-31')])
    expect(r.map((i) => i.nombre)).toEqual(['A', 'B'])
  })

  it('lista vacía devuelve lista vacía', () => {
    expect(ordenarPorVencimiento([])).toEqual([])
  })
})

describe('separarVencidos (R4)', () => {
  it('vence hoy NO es vencido; ayer sí', () => {
    const pollo = ing('Pollo', 500, 'g', HOY)
    const leche = ing('Leche', 1, 'l', en(-1))
    const r = separarVencidos([pollo, leche], HOY)
    expect(r.vigentes).toEqual([pollo])
    expect(r.vencidos).toEqual([leche])
  })

  it('grupo 2: una fecha pasada registrada por el usuario aparece en vencidos', () => {
    const viejo = ing('Yogur', 1, 'unidad', '2026-03-01')
    expect(separarVencidos([viejo], HOY).vencidos).toEqual([viejo])
  })

  it('cada grupo queda ordenado por vencimiento', () => {
    const r = separarVencidos(
      [ing('c', 1, 'g', en(5)), ing('a', 1, 'g', en(-1)), ing('d', 1, 'g', en(1)), ing('b', 1, 'g', en(-9))],
      HOY,
    )
    expect(r.vencidos.map((i) => i.nombre)).toEqual(['b', 'a'])
    expect(r.vigentes.map((i) => i.nombre)).toEqual(['d', 'c'])
  })

  it('grupo 9: el mismo dato cambia de sección al avanzar el día', () => {
    const queso = ing('Queso', 250, 'g', en(3))
    expect(separarVencidos([queso], HOY).vigentes).toEqual([queso])
    expect(separarVencidos([queso], en(3)).vigentes).toEqual([queso]) // vence hoy
    expect(separarVencidos([queso], en(4)).vencidos).toEqual([queso])
    expect(separarVencidos([queso], en(4)).vigentes).toEqual([])
  })

  it('despensa vacía no falla', () => {
    expect(separarVencidos([], HOY)).toEqual({ vigentes: [], vencidos: [] })
  })
})

describe('grupo 4: lotes y cantidadDisponible', () => {
  const despensa: Ingrediente[] = [
    ing('Arroz', 500, 'g', en(180)),
    ing('Arroz', 250, 'g', en(-5)),
    ing('Leche', 1, 'l', en(-1)),
  ]

  it('con un lote vencido y uno vigente solo cuenta el vigente (500, no 750)', () => {
    expect(cantidadDisponible(despensa, 'Arroz', 'g', HOY)).toBe(500)
  })

  it('un ingrediente con todos los lotes vencidos tiene 0 disponible', () => {
    expect(cantidadDisponible(despensa, 'leche', 'l', HOY)).toBe(0)
  })

  it('un ingrediente que no existe tiene 0 disponible', () => {
    expect(cantidadDisponible(despensa, 'Aguacate', 'unidad', HOY)).toBe(0)
  })

  it('el lote que vence hoy SÍ cuenta', () => {
    expect(cantidadDisponible([ing('Pollo', 500, 'g', HOY)], 'pollo', 'g', HOY)).toBe(500)
  })

  it('suma varios lotes vigentes, también con unidades distintas (1 kg + 500 g = 1500 g)', () => {
    const d = [ing('Arroz', 1, 'kg', en(30)), ing('Arroz', 500, 'g', en(60))]
    expect(cantidadDisponible(d, 'Arroz', 'g', HOY)).toBe(1500)
    expect(cantidadDisponible(d, 'Arroz', 'kg', HOY)).toBe(1.5)
  })

  it('el nombre se compara normalizado (" ARROZ " y "arroz" son el mismo)', () => {
    const d = [ing(' ARROZ ', 100, 'g', en(5)), ing('arroz', 50, 'g', en(5))]
    expect(cantidadDisponible(d, 'Arroz', 'g', HOY)).toBe(150)
  })

  it('un lote con unidad incompatible no suma', () => {
    const d = [ing('Huevos', 6, 'unidad', en(5)), ing('Huevos', 300, 'g', en(5))]
    expect(cantidadDisponible(d, 'huevos', 'unidad', HOY)).toBe(6)
  })

  it('grupo 9: el mismo lote deja de contar cuando cambia el día', () => {
    const d = [ing('Leche', 1, 'l', en(2))]
    expect(cantidadDisponible(d, 'leche', 'l', HOY)).toBe(1)
    expect(cantidadDisponible(d, 'leche', 'l', en(2))).toBe(1)
    expect(cantidadDisponible(d, 'leche', 'l', en(3))).toBe(0)
  })

  it('grupo 2: duplicado exacto se guarda como otro lote y suma (2 + 2 = 4)', () => {
    const v = { nombre: 'Tomate', cantidad: 2, unidad: 'unidad' as const, vence: en(3) }
    let d: Ingrediente[] = []
    d = agregarIngrediente(d, v, 'a')
    d = agregarIngrediente(d, v, 'b')
    expect(d).toHaveLength(2)
    expect(cantidadDisponible(d, 'tomate', 'unidad', HOY)).toBe(4)
  })
})
