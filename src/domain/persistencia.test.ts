import { describe, expect, it } from 'vitest'
import { actualizarIngrediente, agregarIngrediente, eliminarIngrediente } from './despensa'
import { leerDespensa, serializarDespensa } from './persistencia'
import { en, ing } from './pruebas-util'
import type { Ingrediente, IngredienteValido } from './tipos'

const valido = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    version: 1,
    ingredientes: [{ id: 'a', nombre: 'Tomate', cantidad: 2, unidad: 'unidad', vence: '2026-03-20', ...extra }],
  })

describe('grupo 8: datos guardados corruptos o con formato viejo', () => {
  it('nada guardado → vacío (la capa de storage cargará el seed)', () => {
    expect(leerDespensa(null)).toEqual({ estado: 'vacio' })
  })

  it.each<[string, string]>([
    ['texto vacío', ''],
    ['JSON truncado', '{"version":1,"ingredientes":[{"id":"a"'],
    ['texto que no es JSON', 'hola mundo'],
    ['null', 'null'],
    ['un número', '42'],
    ['un string', '"texto"'],
    ['objeto sin lista de ingredientes', '{"version":1}'],
    ['ingredientes que no es lista', '{"version":1,"ingredientes":"x"}'],
    ['ingrediente nulo dentro de la lista', '{"version":1,"ingredientes":[null]}'],
    ['ingrediente con cantidad negativa', valido({ cantidad: -1 })],
    ['ingrediente con cantidad 0', valido({ cantidad: 0 })],
    ['ingrediente con cantidad en texto', valido({ cantidad: '2' })],
    ['ingrediente con cantidad enorme', valido({ cantidad: 1e9 })],
    ['ingrediente con unidad desconocida', valido({ unidad: 'taza' })],
    ['ingrediente con fecha imposible', valido({ vence: '2026-02-31' })],
    ['ingrediente sin nombre', valido({ nombre: '   ' })],
    ['ingrediente con nombre de 200 caracteres', valido({ nombre: 'a'.repeat(200) })],
    ['ingrediente sin id', valido({ id: '' })],
  ])('%s → "corrupto" sin lanzar error', (_n, texto) => {
    const r = leerDespensa(texto)
    expect(r.estado).toBe('corrupto')
    if (r.estado === 'corrupto') expect(r.motivo.length).toBeGreaterThan(0)
  })

  it.each<[string, string]>([
    ['lista suelta sin versión (formato viejo)', '[]'],
    ['lista de ingredientes viejos', '[{"nombre":"Tomate","qty":2}]'],
    ['versión anterior', '{"version":0,"ingredientes":[]}'],
    ['versión futura', '{"version":2,"ingredientes":[]}'],
    ['objeto sin versión', '{"ingredientes":[]}'],
  ])('%s → "formato-viejo" sin lanzar error', (_n, texto) => {
    const r = leerDespensa(texto)
    expect(r.estado).toBe('formato-viejo')
  })

  it('una lista válida vacía es "ok" (distinto de "vacío": el usuario borró todo)', () => {
    expect(leerDespensa('{"version":1,"ingredientes":[]}')).toEqual({ estado: 'ok', ingredientes: [] })
  })

  it('un ingrediente válido se lee tal cual', () => {
    const r = leerDespensa(valido())
    expect(r).toEqual({
      estado: 'ok',
      ingredientes: [{ id: 'a', nombre: 'Tomate', cantidad: 2, unidad: 'unidad', vence: '2026-03-20' }],
    })
  })

  it('un solo ingrediente malo entre varios buenos invalida todo (no se carga a medias)', () => {
    const texto = JSON.stringify({
      version: 1,
      ingredientes: [ing('Bueno', 1, 'g', en(1), 'x'), { id: 'y', nombre: 'Malo', cantidad: -5, unidad: 'g', vence: en(1) }],
    })
    expect(leerDespensa(texto).estado).toBe('corrupto')
  })
})

describe('grupo 10: agregar, editar y borrar sobreviven a una recarga', () => {
  // Una "recarga" = serializar lo guardado y leerlo de nuevo. La prueba con localStorage real y el
  // navegador se hace en la Fase 2; aquí se prueba que el dominio no pierde ni altera datos.
  const recargar = (lista: readonly Ingrediente[]): Ingrediente[] => {
    const r = leerDespensa(serializarDespensa(lista))
    if (r.estado !== 'ok') throw new Error(`la recarga falló: ${r.estado}`)
    return r.ingredientes
  }

  const tomate: IngredienteValido = { nombre: 'Tomate', cantidad: 4, unidad: 'unidad', vence: en(1) }
  const queso: IngredienteValido = { nombre: 'Queso', cantidad: 250, unidad: 'g', vence: en(3) }

  it('agregar, recargar, editar, recargar, borrar, recargar', () => {
    let d: Ingrediente[] = []
    d = agregarIngrediente(d, tomate, 'a')
    d = agregarIngrediente(d, queso, 'b')
    expect(recargar(d)).toEqual([
      { id: 'a', ...tomate },
      { id: 'b', ...queso },
    ])

    const editado: IngredienteValido = { nombre: 'Tomate cherry', cantidad: 1.5, unidad: 'kg', vence: en(5) }
    d = actualizarIngrediente(recargar(d), 'a', editado)
    expect(recargar(d)).toEqual([
      { id: 'a', ...editado },
      { id: 'b', ...queso },
    ])

    d = eliminarIngrediente(recargar(d), 'b')
    expect(recargar(d)).toEqual([{ id: 'a', ...editado }])

    d = eliminarIngrediente(d, 'a')
    expect(recargar(d)).toEqual([]) // borrar todo también persiste (no vuelve el seed)
  })

  it('editar solo cambia el ingrediente con ese id y no crea uno nuevo', () => {
    const d = [ing('A', 1, 'g', en(1), 'a'), ing('B', 2, 'g', en(2), 'b')]
    const nuevo = actualizarIngrediente(d, 'b', { nombre: 'B2', cantidad: 9, unidad: 'kg', vence: en(9) })
    expect(nuevo).toHaveLength(2)
    expect(nuevo[0]).toEqual(d[0])
    expect(nuevo[1]).toEqual({ id: 'b', nombre: 'B2', cantidad: 9, unidad: 'kg', vence: en(9) })
  })

  it('editar o borrar un id que no existe no cambia nada', () => {
    const d = [ing('A', 1, 'g', en(1), 'a')]
    expect(actualizarIngrediente(d, 'zzz', tomate)).toEqual(d)
    expect(eliminarIngrediente(d, 'zzz')).toEqual(d)
  })

  it('las operaciones no mutan la lista original', () => {
    const d = [ing('A', 1, 'g', en(1), 'a')]
    const copia = JSON.stringify(d)
    agregarIngrediente(d, tomate, 'n')
    actualizarIngrediente(d, 'a', tomate)
    eliminarIngrediente(d, 'a')
    expect(JSON.stringify(d)).toBe(copia)
  })

  it('el round-trip conserva decimales pequeños y nombres con tildes', () => {
    const d = [ing('Harina de maíz', 0.0001, 'kg', en(120), 'h')]
    expect(recargar(d)).toEqual(d)
  })
})
