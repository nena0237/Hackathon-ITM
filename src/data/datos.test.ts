import { describe, expect, it } from 'vitest'
import { diasParaVencer, esVencido, separarVencidos, sugerirRecetas, validarIngrediente, normalizarNombre } from '../domain'
import { RECETAS } from './recetas'
import { crearSeed } from './seed'

const HOY = '2026-03-15'
const sugerencias = (hoy = HOY) => sugerirRecetas(RECETAS, crearSeed(hoy), hoy)
const de = (id: string, hoy = HOY) => sugerencias(hoy).find((s) => s.receta.id === id)!

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

describe('colección de recetas (R8): validez de cada receta', () => {
  const UNIDADES_OK = ['g', 'kg', 'ml', 'l', 'unidad']

  it('son 22, con ids y nombres únicos (el id es kebab-case)', () => {
    expect(RECETAS).toHaveLength(22)
    expect(new Set(RECETAS.map((r) => r.id)).size).toBe(22)
    expect(new Set(RECETAS.map((r) => r.nombre)).size).toBe(22)
    for (const r of RECETAS) expect(r.id, r.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('ids renombrados: "arroz-con-leche" ya no existe y "mazamorra-cremosa" sí; "huevos-pericos" se conserva', () => {
    const ids = RECETAS.map((r) => r.id)
    expect(ids).not.toContain('arroz-con-leche')
    expect(ids).toContain('mazamorra-cremosa')
    expect(ids).toContain('huevos-pericos')
  })

  for (const r of RECETAS) {
    describe(r.id, () => {
      it('tiene nombre y de 1 a 7 ingredientes, sin repetir ninguno', () => {
        expect(r.nombre.trim()).not.toBe('')
        expect(r.ingredientes.length).toBeGreaterThanOrEqual(1)
        expect(r.ingredientes.length).toBeLessThanOrEqual(7)
        const normalizados = r.ingredientes.map((i) => normalizarNombre(i.nombre))
        expect(new Set(normalizados).size).toBe(normalizados.length)
      })

      it('ingredientes en minúscula y ya normalizados (sin espacios extra)', () => {
        for (const i of r.ingredientes) {
          expect(i.nombre, i.nombre).toBe(i.nombre.toLowerCase())
          expect(i.nombre, i.nombre).toBe(i.nombre.trim().replace(/\s+/g, ' '))
          expect(i.nombre.length, i.nombre).toBeGreaterThan(0)
        }
      })

      it('unidades dentro de g, kg, ml, l y unidad', () => {
        for (const i of r.ingredientes) expect(UNIDADES_OK, `${i.nombre}: ${i.unidad}`).toContain(i.unidad)
      })

      it('cantidades finitas y mayores que 0', () => {
        for (const i of r.ingredientes) {
          expect(Number.isFinite(i.cantidad), i.nombre).toBe(true)
          expect(i.cantidad, i.nombre).toBeGreaterThan(0)
        }
      })

      it('instrucciones de 2 a 4 líneas, ninguna vacía', () => {
        const lineas = r.instrucciones.split('\n')
        expect(lineas.length).toBeGreaterThanOrEqual(2)
        expect(lineas.length).toBeLessThanOrEqual(4)
        for (const l of lineas) expect(l.trim()).not.toBe('')
      })
    })
  }

  it('la colección usa las 5 unidades', () => {
    const unidades = new Set(RECETAS.flatMap((r) => r.ingredientes.map((i) => i.unidad)))
    expect([...unidades].sort()).toEqual(['g', 'kg', 'l', 'ml', 'unidad'])
  })
})

describe('demo: seed + recetas + dominio (fecha fija 2026-03-15)', () => {
  const IDS_COCINABLES = ['arroz-meloso-pollo-huevo', 'bunuelos-horno', 'huevos-pericos', 'pollo-costra-maiz-queso', 'tacos-arepa-pollo-hogao']
  const IDS_UN_FALTANTE = ['mazamorra-cremosa', 'pollo-maracuya', 'tortilla-papa-criolla']

  it('5 cocinables y 17 parciales (conteo real con el seed)', () => {
    const s = sugerencias()
    expect(s.filter((x) => x.estado === 'cocinable').map((x) => x.receta.id).sort()).toEqual(IDS_COCINABLES)
    expect(s.filter((x) => x.estado === 'parcial')).toHaveLength(17)
  })

  it('exactamente 3 parciales con un solo faltante: tortilla (no-hay), pollo-maracuyá (no-hay) y mazamorra (vencido)', () => {
    const unaFalta = sugerencias().filter((x) => x.estado === 'parcial' && x.faltantes.length === 1)
    expect(unaFalta.map((x) => x.receta.id).sort()).toEqual(IDS_UN_FALTANTE)
    const motivo = (id: string) => unaFalta.find((x) => x.receta.id === id)!.faltantes[0]
    expect(motivo('tortilla-papa-criolla')).toMatchObject({ nombre: 'papa criolla', motivo: 'no-hay' })
    expect(motivo('pollo-maracuya')).toMatchObject({ nombre: 'maracuyá', motivo: 'no-hay' })
    expect(motivo('mazamorra-cremosa')).toMatchObject({ nombre: 'leche', motivo: 'vencido', falta: 500 })
  })

  it('Huevos pericos gratinados es cocinable y aprovecha huevos (2 días), tomate (1 día) y queso (3 días)', () => {
    const s = de('huevos-pericos')
    expect(s.estado).toBe('cocinable')
    // Mismo orden en que la receta lista sus ingredientes (huevos, tomate, cebolla, queso).
    expect(s.aprovecha).toEqual([
      { nombre: 'huevos', dias: 2 },
      { nombre: 'tomate', dias: 1 },
      { nombre: 'queso', dias: 3 },
    ])
    expect(s.urgencia).toBe(3)
  })

  it('la mazamorra (antes "arroz con leche") NO es cocinable por la leche vencida; lo demás sí alcanza', () => {
    const s = de('mazamorra-cremosa')
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toHaveLength(1)
    expect(s.faltantes[0]).toMatchObject({ nombre: 'leche', motivo: 'vencido' })
  })

  it('ninguna receta usa el lote vencido de arroz ni la leche vencida: sin ellos el arroz alcanza justo (500 g vigentes)', () => {
    // arroz meloso pide 300 g: alcanza con el lote vigente; pollo-maracuya pide 200 g de arroz y solo le falta la maracuyá.
    expect(de('arroz-meloso-pollo-huevo').estado).toBe('cocinable')
    expect(de('pollo-maracuya').faltantes.map((f) => f.nombre)).toEqual(['maracuyá'])
  })

  it('la conversión kg↔g con datos reales: tacos de arepa (250 g de harina) con 1 kg alcanza', () => {
    expect(de('tacos-arepa-pollo-hogao').estado).toBe('cocinable')
  })

  it('la primera sugerencia son los pericos (urgencia 3); pollo en costra empata en 3 y pierde por nombre', () => {
    const s = sugerencias()
    expect(s[0].receta.id).toBe('huevos-pericos')
    expect(s[0].urgencia).toBe(3)
    expect(s[1].receta.id).toBe('pollo-costra-maiz-queso') // los tacos de arepa (urgencia 3) vienen después por nombre
    expect(s[1].urgencia).toBe(3)
    expect(s[1].aprovecha.map((a) => a.nombre)).toEqual(['pollo', 'huevos', 'queso'])
    expect(s.slice(0, 5).every((x) => x.estado === 'cocinable')).toBe(true)
    expect(s.slice(0, 5).map((x) => x.receta.id).sort()).toEqual(IDS_COCINABLES)
  })

  it('cambio de día: tres días después tomate y huevos vencieron y los pericos pasan a parcial', () => {
    const seed = crearSeed(HOY)
    const despues = sugerirRecetas(RECETAS, seed, '2026-03-18')
    const pericos = despues.find((s) => s.receta.id === 'huevos-pericos')!
    expect(pericos.estado).toBe('parcial')
    expect(pericos.faltantes.map((f) => f.nombre).sort()).toEqual(['huevos', 'tomate']) // el queso vence ese día: NO vencido (borde)
    expect(pericos.faltantes.every((f) => f.motivo === 'vencido')).toBe(true)
  })

  it('con despensa vacía las 22 recetas son parciales con todo faltante', () => {
    const r = sugerirRecetas(RECETAS, [], HOY)
    expect(r).toHaveLength(22)
    for (const s of r) {
      expect(s.estado).toBe('parcial')
      expect(s.faltantes.length).toBe(s.receta.ingredientes.length)
    }
  })
})
