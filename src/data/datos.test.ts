import { describe, expect, it } from 'vitest'
import { diasParaVencer, esVencido, separarVencidos, sugerirRecetas, validarIngrediente, normalizarNombre } from '../domain'
import { RECETAS } from './recetas'
import { crearSeed } from './seed'

const HOY = '2026-03-15'
const sugerencias = (hoy = HOY) => sugerirRecetas(RECETAS, crearSeed(hoy), hoy)
const de = (nombre: string, hoy = HOY) => sugerencias(hoy).find((s) => s.receta.nombre === nombre)!

describe('seed (tabla del brief, fechas relativas)', () => {
  it('tiene los 9 ingredientes con los días relativos exactos', () => {
    const dias = crearSeed(HOY).map((i) => [i.nombre, i.cantidad, i.unidad, diasParaVencer(i.vence, HOY)])
    expect(dias).toEqual([
      ['Leche', 1, 'l', -1],
      ['Tomate', 4, 'unidad', 1],
      ['Huevos', 6, 'unidad', 2],
      ['Queso', 250, 'g', 3],
      ['Pollo', 500, 'g', 0],
      ['Cebolla', 2, 'unidad', 7],
      ['Arroz', 500, 'g', 180],
      ['Harina de maíz', 1, 'kg', 120],
      ['Arroz', 250, 'g', -5],
    ])
  })

  it('las fechas se mueven con hoy: la misma tabla en otro día da las mismas distancias', () => {
    for (const hoy of ['2026-03-15', '2027-12-30', '2028-02-28', '2031-07-01']) {
      const s = crearSeed(hoy)
      expect(diasParaVencer(s[0].vence, hoy)).toBe(-1)
      expect(diasParaVencer(s[4].vence, hoy)).toBe(0)
      expect(diasParaVencer(s[6].vence, hoy)).toBe(180)
    }
    expect(crearSeed('2026-03-15')[1].vence).not.toBe(crearSeed('2026-03-16')[1].vence)
  })

  it('todas las filas pasan la validación del dominio y los ids son únicos', () => {
    const seed = crearSeed(HOY)
    for (const i of seed) expect(validarIngrediente(i).ok).toBe(true)
    expect(new Set(seed.map((i) => i.id)).size).toBe(seed.length)
  })

  it('hay exactamente 2 vencidos (leche y el lote viejo de arroz); pollo (vence hoy) NO', () => {
    const { vencidos, vigentes } = separarVencidos(crearSeed(HOY), HOY)
    expect(vencidos.map((i) => i.id)).toEqual(['seed-arroz-vencido', 'seed-leche'])
    expect(vigentes.map((i) => i.nombre)).toContain('Pollo')
    expect(esVencido(crearSeed(HOY)[4].vence, HOY)).toBe(false)
  })
})

describe('colección de recetas (R8)', () => {
  it('son 12, con los nombres del brief y ids únicos', () => {
    expect(RECETAS.map((r) => r.nombre).sort()).toEqual(
      [
        'Huevos pericos', 'Arepas con queso', 'Arroz con huevo', 'Sopa de tomate', 'Omelette de queso',
        'Arroz con pollo', 'Sudado de pollo', 'Ensalada de tomate y cebolla', 'Arroz con leche',
        'Papas con queso', 'Huevos rancheros', 'Sándwich gratinado',
      ].sort(),
    )
    expect(new Set(RECETAS.map((r) => r.id)).size).toBe(12)
  })

  it('ingredientes en minúscula, cantidades válidas y sin ingredientes repetidos en una receta', () => {
    for (const r of RECETAS) {
      expect(r.ingredientes.length).toBeGreaterThan(0)
      const nombres = r.ingredientes.map((i) => i.nombre)
      for (const n of nombres) expect(n).toBe(n.toLowerCase())
      expect(new Set(nombres.map(normalizarNombre)).size).toBe(nombres.length)
      for (const i of r.ingredientes) expect(i.cantidad).toBeGreaterThan(0)
    }
  })

  it('instrucciones de 2 a 4 líneas', () => {
    for (const r of RECETAS) {
      const lineas = r.instrucciones.split('\n').filter((l) => l.trim() !== '')
      expect(lineas.length, r.nombre).toBeGreaterThanOrEqual(2)
      expect(lineas.length, r.nombre).toBeLessThanOrEqual(4)
    }
  })

  it('mezcla de unidades: g, kg, l y unidad', () => {
    const unidades = new Set(RECETAS.flatMap((r) => r.ingredientes.map((i) => i.unidad)))
    expect([...unidades].sort()).toEqual(['g', 'kg', 'l', 'unidad'])
  })
})

describe('demo: seed + recetas + dominio', () => {
  it('al menos 3 cocinables', () => {
    expect(sugerencias().filter((s) => s.estado === 'cocinable').length).toBeGreaterThanOrEqual(3)
  })

  it('al menos 2 parciales con exactamente 1 faltante', () => {
    const unaFalta = sugerencias().filter((s) => s.estado === 'parcial' && s.faltantes.length === 1)
    expect(unaFalta.length).toBeGreaterThanOrEqual(2)
  })

  it('Huevos pericos es cocinable y aprovecha tomate (mañana) y huevos (en 2 días)', () => {
    const s = de('Huevos pericos')
    expect(s.estado).toBe('cocinable')
    // Mismo orden en que la receta lista sus ingredientes (huevos, tomate, cebolla).
    expect(s.aprovecha).toEqual([
      { nombre: 'huevos', dias: 2 },
      { nombre: 'tomate', dias: 1 },
    ])
    expect(s.urgencia).toBe(2)
  })

  it('Arroz con leche NO es cocinable por la leche vencida (y el arroz sí alcanza)', () => {
    const s = de('Arroz con leche')
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toHaveLength(1)
    expect(s.faltantes[0]).toMatchObject({ nombre: 'leche', motivo: 'vencido', falta: 1 })
  })

  it('la conversión kg↔g funciona con datos reales: Arepas (0,5 kg) con 1 kg de harina alcanza', () => {
    expect(de('Arepas con queso').estado).toBe('cocinable')
  })

  it('el lote vencido de arroz no suma: Arroz con pollo usa solo los 500 g vigentes', () => {
    expect(de('Arroz con pollo').estado).toBe('cocinable')
  })

  it('Huevos pericos es la primera sugerencia (cocinable con más urgencia)', () => {
    expect(sugerencias()[0].receta.nombre).toBe('Huevos pericos')
  })

  it('cambio de día: tres días después la leche sigue vencida y los huevos y el tomate también', () => {
    // El seed se calculó para HOY; si el usuario abre la app 3 días después con los mismos datos:
    const seed = crearSeed(HOY)
    const despues = sugerirRecetas(RECETAS, seed, '2026-03-18')
    const pericos = despues.find((s) => s.receta.nombre === 'Huevos pericos')!
    expect(pericos.estado).toBe('parcial') // tomate (venció 03-16) y huevos (03-17) ya vencieron
    expect(pericos.faltantes.map((f) => f.nombre).sort()).toEqual(['huevos', 'tomate'])
    expect(pericos.faltantes.every((f) => f.motivo === 'vencido')).toBe(true)
  })

  it('con despensa vacía las 12 recetas son parciales con todo faltante', () => {
    const r = sugerirRecetas(RECETAS, [], HOY)
    expect(r).toHaveLength(12)
    for (const s of r) {
      expect(s.estado).toBe('parcial')
      expect(s.faltantes.length).toBe(s.receta.ingredientes.length)
    }
  })
})
