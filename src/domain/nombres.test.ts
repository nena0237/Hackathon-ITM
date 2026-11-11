import { describe, expect, it } from 'vitest'
import { cantidadDisponible } from './despensa'
import { claveNombre, normalizarNombre } from './nombres'
import { sugerirRecetas } from './recetas'
import { en, HOY, ing, rec, ri } from './pruebas-util'

describe('AC-2: clave de comparación (singular/plural)', () => {
  it.each<[string, string]>([
    ['Huevo', 'huevos'],
    ['HUEVOS', 'huevo'],
    ['Tomates', 'tomate'],
    ['Limones', 'limón'],
    ['limones', 'limon'],
    ['Frijoles', 'frijol'],
    ['Papas criollas', 'papa criolla'],
    ['Cebollas', 'cebolla'],
    ['Yogures', 'yogur'],
    ['Coliflores', 'coliflor'],
    ['Verduras', 'verdura'],
    ['  Harina   de MAÍZ ', 'harina de maiz'],
  ])('"%s" y "%s" tienen la misma clave', (a, b) => {
    expect(claveNombre(a)).toBe(claveNombre(b))
  })

  it('palabras que no son plural de la otra no se confunden', () => {
    expect(claveNombre('pan')).not.toBe(claveNombre('pantalla'))
    expect(claveNombre('arroz')).not.toBe(claveNombre('arroz integral'))
    expect(claveNombre('queso')).not.toBe(claveNombre('quesos azules'))
    expect(claveNombre('pollo')).not.toBe(claveNombre('polla'))
  })

  it('la clave no altera la normalización ni el nombre mostrado', () => {
    expect(normalizarNombre('Tomates')).toBe('tomates')
  })

  it('palabras cortas no se mutilan ("res", "mes", "gas")', () => {
    expect(claveNombre('res')).toBe('res')
    expect(claveNombre('gas')).toBe('gas')
  })

  it('cantidadDisponible suma "Huevo" y "huevos" como el mismo ingrediente', () => {
    const d = [ing('Huevo', 2, 'unidad', en(3)), ing('HUEVOS', 4, 'unidad', en(5))]
    expect(cantidadDisponible(d, 'huevos', 'unidad', HOY)).toBe(6)
    expect(cantidadDisponible(d, 'Huevo', 'unidad', HOY)).toBe(6)
  })

  it('una receta con "huevos" se cocina con "Huevo" en la despensa y con "Tomates" por "tomate"', () => {
    const pericos = rec('Huevos pericos', [ri('tomate', 2, 'unidad'), ri('huevos', 3, 'unidad')])
    const d = [ing('Huevo', 6, 'unidad', en(2)), ing('Tomates', 4, 'unidad', en(1))]
    const s = sugerirRecetas([pericos], d, HOY)[0]
    expect(s.estado).toBe('cocinable')
    expect(s.aprovecha.map((a) => a.nombre)).toEqual(['tomate', 'huevos'])
  })

  it('caso inverso: la despensa tiene "huevos" y la receta pide "huevo"; y "limones" con "limón"', () => {
    const r = rec('Limonada', [ri('limón', 3, 'unidad'), ri('huevo', 1, 'unidad')])
    const d = [ing('limones', 5, 'unidad', en(2)), ing('Huevos', 6, 'unidad', en(2))]
    expect(sugerirRecetas([r], d, HOY)[0].estado).toBe('cocinable')
  })

  it('un lote vencido con otro plural sigue siendo vencido (motivo "vencido", no "no-hay")', () => {
    const r = rec('Tortilla', [ri('huevos', 2, 'unidad')])
    const s = sugerirRecetas([r], [ing('Huevo', 6, 'unidad', en(-1))], HOY)[0]
    expect(s.estado).toBe('parcial')
    expect(s.faltantes[0].motivo).toBe('vencido')
  })

  it('ingredientes distintos no se mezclan por la clave', () => {
    const r = rec('Salsa', [ri('tomate', 1, 'unidad')])
    expect(sugerirRecetas([r], [ing('Tomate de árbol', 5, 'unidad', en(3))], HOY)[0].estado).toBe('parcial')
  })
})
