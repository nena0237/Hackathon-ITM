import { describe, expect, it } from 'vitest'
import { sugerirRecetas } from './recetas'
import { en, HOY, ing, rec, ri } from './pruebas-util'
import type { Ingrediente } from './tipos'

// Despensa tipo seed (fechas relativas a HOY).
const seed: Ingrediente[] = [
  ing('Leche', 1, 'l', en(-1)),
  ing('Tomate', 4, 'unidad', en(1)),
  ing('Huevos', 6, 'unidad', en(2)),
  ing('Queso', 250, 'g', en(3)),
  ing('Pollo', 500, 'g', HOY),
  ing('Cebolla', 2, 'unidad', en(7)),
  ing('Arroz', 500, 'g', en(180)),
  ing('Harina de maíz', 1, 'kg', en(120)),
  ing('Arroz', 250, 'g', en(-5)),
]

const pericos = rec('Huevos pericos', [ri('tomate', 2, 'unidad'), ri('huevos', 3, 'unidad')])
const arrozHuevo = rec('Arroz con huevo', [ri('arroz', 200, 'g'), ri('huevos', 2, 'unidad')])
const ensalada = rec('Ensalada de tomate y cebolla', [ri('tomate', 2, 'unidad'), ri('cebolla', 1, 'unidad')])
const arrozLeche = rec('Arroz con leche', [ri('arroz', 100, 'g'), ri('leche', 1, 'l')])
const sopa = rec('Sopa de tomate', [ri('tomate', 2, 'unidad'), ri('cebolla', 1, 'unidad'), ri('caldo', 1, 'l')])
const arrozGrande = rec('Arroz grande', [ri('arroz', 1, 'kg')])

const porNombre = (s: ReturnType<typeof sugerirRecetas>, n: string) => s.find((x) => x.receta.nombre === n)!

describe('sugerirRecetas con el seed (R5, R6)', () => {
  const r = sugerirRecetas([arrozGrande, sopa, arrozLeche, ensalada, arrozHuevo, pericos], seed, HOY)

  it('ranking exacto: cocinables por urgencia/nombre, luego parciales por urgencia/faltantes/nombre', () => {
    expect(r.map((s) => s.receta.nombre)).toEqual([
      'Huevos pericos', // cocinable, urgencia 2
      'Arroz con huevo', // cocinable, urgencia 1, nombre antes que Ensalada
      'Ensalada de tomate y cebolla', // cocinable, urgencia 1
      'Sopa de tomate', // parcial, urgencia 1
      'Arroz con leche', // parcial, urgencia 0, nombre
      'Arroz grande', // parcial, urgencia 0
    ])
  })

  it('Huevos pericos es cocinable y aprovecha tomate (1 día) y huevos (2 días)', () => {
    const s = porNombre(r, 'Huevos pericos')
    expect(s.estado).toBe('cocinable')
    expect(s.faltantes).toEqual([])
    expect(s.aprovecha).toEqual([
      { nombre: 'tomate', dias: 1 },
      { nombre: 'huevos', dias: 2 },
    ])
    expect(s.urgencia).toBe(2)
  })

  it('Arroz con leche NO es cocinable porque la leche está vencida', () => {
    const s = porNombre(r, 'Arroz con leche')
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toEqual([
      { nombre: 'leche', unidad: 'l', necesita: 1, disponible: 0, falta: 1, motivo: 'vencido' },
    ])
  })

  it('un ingrediente que no existe es faltante con motivo "no-hay" y cuánto falta', () => {
    const s = porNombre(r, 'Sopa de tomate')
    expect(s.faltantes).toEqual([
      { nombre: 'caldo', unidad: 'l', necesita: 1, disponible: 0, falta: 1, motivo: 'no-hay' },
    ])
  })

  it('solo aprovecha ingredientes por vencer (0 a 3 días): cebolla (7 días) no cuenta', () => {
    expect(porNombre(r, 'Ensalada de tomate y cebolla').aprovecha).toEqual([{ nombre: 'tomate', dias: 1 }])
  })

  it('el lote que vence hoy cuenta como disponible y como por vencer (días = 0)', () => {
    const [s] = sugerirRecetas([rec('Pollo asado', [ri('pollo', 500, 'g')])], seed, HOY)
    expect(s.estado).toBe('cocinable')
    expect(s.aprovecha).toEqual([{ nombre: 'pollo', dias: 0 }])
  })

  it('no modifica ni la despensa ni la lista de recetas recibidas', () => {
    const recetas = [arrozLeche, pericos]
    const antes = JSON.stringify([recetas, seed])
    sugerirRecetas(recetas, seed, HOY)
    expect(JSON.stringify([recetas, seed])).toBe(antes)
  })
})

describe('grupo 4: lotes dentro de las recetas', () => {
  it('el lote vencido no ayuda: 500 vigentes + 250 vencidos no alcanzan para 600 g', () => {
    const [s] = sugerirRecetas([rec('Arroz grande', [ri('arroz', 600, 'g')])], seed, HOY)
    expect(s.estado).toBe('parcial')
    expect(s.faltantes[0]).toMatchObject({ disponible: 500, falta: 100, motivo: 'insuficiente' })
  })

  it('el mismo ingrediente en dos lotes vigentes se suma', () => {
    const d = [ing('Huevos', 2, 'unidad', en(1)), ing('Huevos', 3, 'unidad', en(5))]
    const [s] = sugerirRecetas([rec('Cinco huevos', [ri('huevos', 5, 'unidad')])], d, HOY)
    expect(s.estado).toBe('cocinable')
  })

  it('si un lote urgente y uno lejano alcanzan juntos, aprovecha reporta los días del más urgente', () => {
    const d = [ing('Huevos', 2, 'unidad', en(1)), ing('Huevos', 3, 'unidad', en(30))]
    const [s] = sugerirRecetas([rec('Cinco huevos', [ri('huevos', 5, 'unidad')])], d, HOY)
    expect(s.aprovecha).toEqual([{ nombre: 'huevos', dias: 1 }])
  })

  it('un lote vencido nunca aparece como aprovechado', () => {
    const d = [ing('Tomate', 4, 'unidad', en(-1))]
    const [s] = sugerirRecetas([rec('Tomate solo', [ri('tomate', 1, 'unidad')])], d, HOY)
    expect(s.aprovecha).toEqual([])
    expect(s.urgencia).toBe(0)
  })
})

describe('grupo 5: unidades dentro de las recetas', () => {
  const g500 = [ing('Harina', 500, 'g', en(40))]

  it('500 g disponibles vs receta que pide 0.5 kg: alcanza', () => {
    const [s] = sugerirRecetas([rec('r', [ri('harina', 0.5, 'kg')])], g500, HOY)
    expect(s.estado).toBe('cocinable')
    expect(s.faltantes).toEqual([])
  })

  it('500 g disponibles vs receta que pide 1 kg: falta 0.5 kg', () => {
    const [s] = sugerirRecetas([rec('r', [ri('harina', 1, 'kg')])], g500, HOY)
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toEqual([
      { nombre: 'harina', unidad: 'kg', necesita: 1, disponible: 0.5, falta: 0.5, motivo: 'insuficiente' },
    ])
  })

  it('exactamente lo necesario alcanza (límite: 500 g vs 500 g)', () => {
    const [s] = sugerirRecetas([rec('r', [ri('harina', 500, 'g')])], g500, HOY)
    expect(s.estado).toBe('cocinable')
  })

  it('g vs unidad es incompatible: cuenta como faltante completo, aunque haya cantidad', () => {
    const [s] = sugerirRecetas([rec('r', [ri('harina', 2, 'unidad')])], g500, HOY)
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toEqual([
      { nombre: 'harina', unidad: 'unidad', necesita: 2, disponible: 0, falta: 2, motivo: 'unidad-incompatible' },
    ])
  })

  it('g vs ml es incompatible', () => {
    const [s] = sugerirRecetas([rec('r', [ri('harina', 100, 'ml')])], g500, HOY)
    expect(s.faltantes[0]).toMatchObject({ motivo: 'unidad-incompatible', falta: 100 })
  })

  it('ml vs l: 1500 ml alcanzan para 1 l; 500 ml no (falta 0.5 l)', () => {
    const r1 = sugerirRecetas([rec('r', [ri('leche', 1, 'l')])], [ing('Leche', 1500, 'ml', en(2))], HOY)
    expect(r1[0].estado).toBe('cocinable')
    const r2 = sugerirRecetas([rec('r', [ri('leche', 1, 'l')])], [ing('Leche', 500, 'ml', en(2))], HOY)
    expect(r2[0].faltantes).toEqual([
      { nombre: 'leche', unidad: 'l', necesita: 1, disponible: 0.5, falta: 0.5, motivo: 'insuficiente' },
    ])
  })

  it('un ingrediente por vencer con unidad incompatible no se reporta como aprovechado', () => {
    const d = [ing('Harina', 500, 'g', en(1))]
    const [s] = sugerirRecetas([rec('r', [ri('harina', 2, 'unidad')])], d, HOY)
    expect(s.aprovecha).toEqual([])
  })
})

describe('grupo 6: único ingrediente disponible está vencido', () => {
  it('la receta no es cocinable y el ingrediente es faltante con motivo "vencido"', () => {
    const d = [ing('Leche', 1, 'l', en(-1))]
    const [s] = sugerirRecetas([rec('Leche tibia', [ri('leche', 1, 'l')])], d, HOY)
    expect(s.estado).toBe('parcial')
    expect(s.faltantes).toEqual([
      { nombre: 'leche', unidad: 'l', necesita: 1, disponible: 0, falta: 1, motivo: 'vencido' },
    ])
    expect(s.aprovecha).toEqual([])
  })

  it('el día anterior (cuando aún vencía hoy) la misma receta sí era cocinable', () => {
    const d = [ing('Leche', 1, 'l', en(-1))]
    const [s] = sugerirRecetas([rec('Leche tibia', [ri('leche', 1, 'l')])], d, en(-1))
    expect(s.estado).toBe('cocinable')
  })
})

describe('grupo 7: despensa vacía', () => {
  const recetas = [pericos, arrozLeche, sopa]

  it('todo parcial con todo faltante y sin errores', () => {
    const r = sugerirRecetas(recetas, [], HOY)
    expect(r).toHaveLength(3)
    for (const s of r) {
      expect(s.estado).toBe('parcial')
      expect(s.aprovecha).toEqual([])
      expect(s.urgencia).toBe(0)
      expect(s.faltantes).toHaveLength(s.receta.ingredientes.length)
      s.faltantes.forEach((f, i) => {
        expect(f).toMatchObject({ motivo: 'no-hay', disponible: 0, falta: s.receta.ingredientes[i].cantidad })
      })
    }
  })

  it('sin recetas devuelve lista vacía', () => {
    expect(sugerirRecetas([], seed, HOY)).toEqual([])
  })

  it('despensa vacía: orden por menos faltantes y luego nombre', () => {
    const r = sugerirRecetas(recetas, [], HOY)
    expect(r.map((s) => s.receta.nombre)).toEqual(['Arroz con leche', 'Huevos pericos', 'Sopa de tomate'])
  })
})

describe('ranking: reglas de desempate', () => {
  it('cocinable gana a parcial aunque el parcial aproveche más urgencia', () => {
    const d = [ing('Tomate', 4, 'unidad', en(1)), ing('Huevos', 6, 'unidad', en(1)), ing('Sal', 100, 'g', en(300))]
    const parcialUrgente = rec('A parcial', [ri('tomate', 1, 'unidad'), ri('huevos', 1, 'unidad'), ri('oregano', 1, 'g')])
    const cocinableCalma = rec('Z cocinable', [ri('sal', 10, 'g')])
    const r = sugerirRecetas([parcialUrgente, cocinableCalma], d, HOY)
    expect(r.map((s) => s.receta.nombre)).toEqual(['Z cocinable', 'A parcial'])
  })

  it('más urgencia gana a menos faltantes entre parciales', () => {
    const d = [ing('Tomate', 4, 'unidad', en(1)), ing('Sal', 100, 'g', en(300))]
    const urgenteDosFaltas = rec('Urgente', [ri('tomate', 1, 'unidad'), ri('a', 1, 'g'), ri('b', 1, 'g')])
    const calmaUnaFalta = rec('Calma', [ri('sal', 10, 'g'), ri('a', 1, 'g')])
    const r = sugerirRecetas([calmaUnaFalta, urgenteDosFaltas], d, HOY)
    expect(r.map((s) => s.receta.nombre)).toEqual(['Urgente', 'Calma'])
  })

  it('con igual urgencia, menos faltantes primero (antes que el nombre)', () => {
    const d = [ing('Tomate', 4, 'unidad', en(1))]
    const dosFaltas = rec('A dos faltas', [ri('tomate', 1, 'unidad'), ri('x', 1, 'g'), ri('y', 1, 'g')])
    const unaFalta = rec('Z una falta', [ri('tomate', 1, 'unidad'), ri('x', 1, 'g')])
    const r = sugerirRecetas([dosFaltas, unaFalta], d, HOY)
    expect(r.map((s) => s.receta.nombre)).toEqual(['Z una falta', 'A dos faltas'])
  })

  it('con todo igual, orden alfabético por nombre', () => {
    const r = sugerirRecetas([rec('Beta', [ri('x', 1, 'g')]), rec('Alfa', [ri('x', 1, 'g')])], [], HOY)
    expect(r.map((s) => s.receta.nombre)).toEqual(['Alfa', 'Beta'])
  })
})

describe('grupo 9: cambio de día en las sugerencias', () => {
  const leche = [ing('Leche', 1, 'l', en(2))]
  const receta = rec('Leche tibia', [ri('leche', 1, 'l')])

  it('por vencer hoy → cocinable y aprovechada; el día que vence sigue cocinable; al día siguiente ya no', () => {
    const hoy = sugerirRecetas([receta], leche, HOY)[0]
    expect(hoy.estado).toBe('cocinable')
    expect(hoy.aprovecha).toEqual([{ nombre: 'leche', dias: 2 }])

    const venceHoy = sugerirRecetas([receta], leche, en(2))[0]
    expect(venceHoy.estado).toBe('cocinable')
    expect(venceHoy.aprovecha).toEqual([{ nombre: 'leche', dias: 0 }])

    const venció = sugerirRecetas([receta], leche, en(3))[0]
    expect(venció.estado).toBe('parcial')
    expect(venció.faltantes[0].motivo).toBe('vencido')
  })

  it('un ingrediente a 4 días aún no es urgente; a 3 días sí', () => {
    const d = [ing('Leche', 1, 'l', en(4))]
    expect(sugerirRecetas([receta], d, HOY)[0].aprovecha).toEqual([])
    expect(sugerirRecetas([receta], d, en(1))[0].aprovecha).toEqual([{ nombre: 'leche', dias: 3 }])
  })
})
