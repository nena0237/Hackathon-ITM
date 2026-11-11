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
    expect(leerDespensa('{"version":1,"ingredientes":[]}')).toEqual({ estado: 'ok', ingredientes: [], descartados: 0 })
  })

  it('un ingrediente válido se lee tal cual', () => {
    const r = leerDespensa(valido())
    expect(r).toEqual({
      estado: 'ok',
      ingredientes: [{ id: 'a', nombre: 'Tomate', cantidad: 2, unidad: 'unidad', vence: '2026-03-20' }],
      descartados: 0,
    })
  })

  it('AC-5: un ingrediente malo entre varios buenos se descarta y los demás se conservan', () => {
    const texto = JSON.stringify({
      version: 1,
      ingredientes: [ing('Bueno', 1, 'g', en(1), 'x'), { id: 'y', nombre: 'Malo', cantidad: -5, unidad: 'g', vence: en(1) }, ing('Otro', 2, 'kg', en(2), 'z')],
    })
    const r = leerDespensa(texto)
    expect(r).toEqual({ estado: 'ok', ingredientes: [ing('Bueno', 1, 'g', en(1), 'x'), ing('Otro', 2, 'kg', en(2), 'z')], descartados: 1 })
  })

  it('AC-5: cuenta cada registro descartado (nulos, cantidades fuera de rango, fechas imposibles)', () => {
    const texto = JSON.stringify({
      version: 1,
      ingredientes: [
        ing('Bueno', 1, 'g', en(1), 'x'),
        null,
        { id: 'a', nombre: 'Enorme', cantidad: 100001, unidad: 'g', vence: en(1) },
        { id: 'b', nombre: 'Fecha', cantidad: 1, unidad: 'g', vence: '2026-02-31' },
        'texto suelto',
      ],
    })
    const r = leerDespensa(texto)
    expect(r.estado).toBe('ok')
    if (r.estado === 'ok') {
      expect(r.ingredientes.map((i) => i.nombre)).toEqual(['Bueno'])
      expect(r.descartados).toBe(4)
    }
  })

  it('AC-5: si NINGÚN registro es válido (y había alguno) sigue siendo "corrupto"', () => {
    const texto = JSON.stringify({ version: 1, ingredientes: [{ id: 'y', nombre: 'Malo', cantidad: -5, unidad: 'g', vence: en(1) }, null] })
    expect(leerDespensa(texto).estado).toBe('corrupto')
  })

  it('AC-7: ids repetidos se regeneran sin perder ningún dato', () => {
    const texto = JSON.stringify({
      version: 1,
      ingredientes: [ing('Lentejas', 500, 'g', en(40), 'x'), ing('Aguacate', 2, 'unidad', en(2), 'x'), ing('Papa', 1, 'kg', en(9), 'x'), ing('Otro', 1, 'g', en(9), 'x-2')],
    })
    const r = leerDespensa(texto)
    expect(r.estado).toBe('ok')
    if (r.estado !== 'ok') return
    expect(r.ingredientes.map((i) => i.nombre)).toEqual(['Lentejas', 'Aguacate', 'Papa', 'Otro'])
    expect(r.ingredientes.map((i) => i.cantidad)).toEqual([500, 2, 1, 1])
    const ids = r.ingredientes.map((i) => i.id)
    expect(new Set(ids).size).toBe(4)
    expect(ids[0]).toBe('x') // el primero conserva su id
    expect(ids[3]).toBe('x-2') // un id que ya era único no se toca
    expect(r.descartados).toBe(0)
  })

  it('AC-7: después de regenerar, borrar o editar uno ya no afecta al otro', () => {
    const texto = JSON.stringify({ version: 1, ingredientes: [ing('A', 1, 'g', en(5), 'x'), ing('B', 1, 'g', en(5), 'x')] })
    const r = leerDespensa(texto)
    if (r.estado !== 'ok') throw new Error('debería leer')
    const idB = r.ingredientes[1].id
    expect(eliminarIngrediente(r.ingredientes, idB).map((i) => i.nombre)).toEqual(['A'])
    expect(actualizarIngrediente(r.ingredientes, idB, { nombre: 'Z', cantidad: 1, unidad: 'g', vence: en(5) }).map((i) => i.nombre)).toEqual(['A', 'Z'])
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
