import { describe, expect, it } from 'vitest'
import { crearSeed } from '../data/seed'
import { actualizarIngrediente, agregarIngrediente, eliminarIngrediente } from '../domain/despensa'
import { CLAVE, CLAVE_RESPALDO, cargarDespensa, guardarDespensa, type Almacen } from './almacen'
import { hoyLocal } from './reloj'

const HOY = '2026-03-15'

/** localStorage falso en memoria. `datos` sobrevive a "recargar" (crear otra carga con el mismo objeto). */
class Memoria implements Almacen {
  datos = new Map<string, string>()
  getItem(k: string) { return this.datos.get(k) ?? null }
  setItem(k: string, v: string) { this.datos.set(k, v) }
}

const recargar = (m: Almacen, hoy = HOY) => cargarDespensa(m, hoy)

describe('clave', () => {
  it('es exactamente foodsaver:v1', () => {
    expect(CLAVE).toBe('foodsaver:v1')
  })
})

describe('primera vez (sin datos)', () => {
  it('carga el seed, lo guarda y no muestra aviso', () => {
    const m = new Memoria()
    const r = cargarDespensa(m, HOY)
    expect(r).toEqual({ ingredientes: crearSeed(HOY), aviso: null, origen: 'seed' })
    expect(m.getItem(CLAVE)).not.toBeNull()
  })

  it('al recargar lee lo guardado (origen "guardado"), no vuelve a generar el seed', () => {
    const m = new Memoria()
    cargarDespensa(m, HOY)
    const r = recargar(m, '2026-04-01') // otro día: las fechas guardadas NO se recalculan
    expect(r.origen).toBe('guardado')
    expect(r.ingredientes).toEqual(crearSeed(HOY))
    expect(r.aviso).toBeNull()
  })
})

describe('grupo 10: agregar, editar y borrar sobreviven a recargar la página', () => {
  it('ciclo completo con recarga entre cada paso', () => {
    const m = new Memoria()
    let d = cargarDespensa(m, HOY).ingredientes

    // agregar
    d = agregarIngrediente(d, { nombre: 'Yogur', cantidad: 2, unidad: 'unidad', vence: '2026-03-20' }, 'n1')
    expect(guardarDespensa(m, d)).toBe(true)
    d = recargar(m).ingredientes
    expect(d.find((i) => i.id === 'n1')).toMatchObject({ nombre: 'Yogur', cantidad: 2 })
    expect(d).toHaveLength(10)

    // editar
    d = actualizarIngrediente(d, 'n1', { nombre: 'Yogur griego', cantidad: 0.5, unidad: 'kg', vence: '2026-03-22' })
    guardarDespensa(m, d)
    d = recargar(m).ingredientes
    expect(d.find((i) => i.id === 'n1')).toEqual({
      id: 'n1', nombre: 'Yogur griego', cantidad: 0.5, unidad: 'kg', vence: '2026-03-22',
    })
    expect(d).toHaveLength(10)

    // borrar uno del seed
    d = eliminarIngrediente(d, 'seed-tomate')
    guardarDespensa(m, d)
    d = recargar(m).ingredientes
    expect(d.map((i) => i.id)).not.toContain('seed-tomate')
    expect(d).toHaveLength(9)
  })

  it('borrar TODO persiste como vacío: no reaparece el seed ni sale aviso', () => {
    const m = new Memoria()
    guardarDespensa(m, [])
    const r = recargar(m)
    expect(r).toEqual({ ingredientes: [], aviso: null, origen: 'guardado' })
  })
})

describe('grupo 8: datos corruptos o con formato viejo', () => {
  it.each<[string, string]>([
    ['JSON roto', '{"version":1,"ingredientes":[{"id"'],
    ['texto cualquiera', 'hola'],
    ['ingrediente con cantidad negativa', JSON.stringify({ version: 1, ingredientes: [{ id: 'a', nombre: 'X', cantidad: -1, unidad: 'g', vence: '2026-03-20' }] })],
    ['formato viejo (lista suelta)', '[{"nombre":"Tomate","qty":2}]'],
    ['versión futura', '{"version":2,"ingredientes":[]}'],
  ])('%s → seed + aviso, copia del original y la app queda usable', (_n, malo) => {
    const m = new Memoria()
    m.setItem(CLAVE, malo)
    const r = cargarDespensa(m, HOY)

    expect(r.origen).toBe('seed')
    expect(r.ingredientes).toEqual(crearSeed(HOY))
    expect(r.aviso).toMatch(/datos de ejemplo/)
    expect(m.getItem(CLAVE_RESPALDO)).toBe(malo) // no se pierde lo que había

    // y la siguiente recarga ya funciona normal, sin repetir el aviso
    const otra = recargar(m)
    expect(otra.origen).toBe('guardado')
    expect(otra.aviso).toBeNull()
    expect(otra.ingredientes).toEqual(crearSeed(HOY))
  })

  it('el aviso distingue dañado de formato anterior', () => {
    const a = new Memoria(); a.setItem(CLAVE, 'basura')
    const b = new Memoria(); b.setItem(CLAVE, '[]')
    expect(cargarDespensa(a, HOY).aviso).toMatch(/dañados/)
    expect(cargarDespensa(b, HOY).aviso).toMatch(/formato anterior/)
  })

  it('un texto vacío guardado también cuenta como corrupto y no rompe', () => {
    const m = new Memoria()
    m.setItem(CLAVE, '')
    expect(cargarDespensa(m, HOY).origen).toBe('seed')
  })
})

describe('almacenamiento no disponible', () => {
  it('sin localStorage (null): seed en memoria con aviso, sin lanzar', () => {
    const r = cargarDespensa(null, HOY)
    expect(r.ingredientes).toEqual(crearSeed(HOY))
    expect(r.aviso).toMatch(/no permite guardar/)
    expect(guardarDespensa(null, r.ingredientes)).toBe(false)
  })

  it('getItem que lanza error (modo privado): seed con aviso', () => {
    const roto: Almacen = { getItem: () => { throw new Error('bloqueado') }, setItem: () => {} }
    const r = cargarDespensa(roto, HOY)
    expect(r.origen).toBe('seed')
    expect(r.aviso).toMatch(/no permite guardar/)
  })

  it('setItem que lanza error (cuota llena): carga el seed y avisa que no se guardará', () => {
    const lleno: Almacen = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
    const r = cargarDespensa(lleno, HOY)
    expect(r.ingredientes).toEqual(crearSeed(HOY))
    expect(r.aviso).toMatch(/no permite guardar/)
    expect(guardarDespensa(lleno, r.ingredientes)).toBe(false)
  })
})

describe('hoyLocal (único uso del reloj)', () => {
  it('devuelve la fecha local YYYY-MM-DD, aun a las 23:59', () => {
    expect(hoyLocal(new Date(2026, 2, 15, 23, 59, 59))).toBe('2026-03-15')
    expect(hoyLocal(new Date(2026, 2, 16, 0, 0, 1))).toBe('2026-03-16')
  })

  it('el formato es siempre AAAA-MM-DD', () => {
    expect(hoyLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

