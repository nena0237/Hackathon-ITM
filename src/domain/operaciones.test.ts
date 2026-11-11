import { describe, expect, it } from 'vitest'
import { agregarValidado, cantidadDisponible, editarValidado, usarIngrediente } from './despensa'
import { leerDespensa, serializarDespensa } from './persistencia'
import { cantidadATexto } from './presentacion'
import { en, HOY, ing } from './pruebas-util'
import type { Ingrediente } from './tipos'
import { validarCantidad } from './validacion'

const entrada = (extra: Record<string, unknown> = {}) => ({ nombre: 'Yogur', cantidad: '2', unidad: 'unidad', vence: en(5), ...extra })
const base = (): Ingrediente[] => [ing('Tomate', 4, 'unidad', en(1), 'a'), ing('Arroz', 500, 'g', en(100), 'b')]

describe('agregarValidado (R1, R3)', () => {
  it('agrega con los datos ya normalizados ("2,5" → 2.5, espacios limpios)', () => {
    const r = agregarValidado(base(), entrada({ nombre: '  Leche   entera ', cantidad: '2,5', unidad: 'l' }), 'n1')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.despensa.at(-1)).toEqual({ id: 'n1', nombre: 'Leche entera', cantidad: 2.5, unidad: 'l', vence: en(5) })
  })

  it.each<[string, unknown]>([
    ['vacía', ''],
    ['cero', 0],
    ['cero en texto', '0'],
    ['negativa', '-3'],
    ['texto abc', 'abc'],
    ['NaN', NaN],
    ['1e9', 1e9],
    ['1e9 en texto', '1e9'],
  ])('cantidad %s: no agrega nada y devuelve el error en el campo cantidad', (_n, cantidad) => {
    const d = base()
    const r = agregarValidado(d, entrada({ cantidad }), 'n1')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errores)).toEqual(['cantidad'])
      expect(r.errores.cantidad!.length).toBeGreaterThan(5)
    }
    expect(d).toEqual(base())
  })

  it('nombre de 200 caracteres: rechazado con mensaje del máximo', () => {
    const r = agregarValidado(base(), entrada({ nombre: 'x'.repeat(200) }), 'n1')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errores.nombre).toMatch(/máximo 60/)
  })

  it('nombre repetido: se guarda como OTRO lote y suma disponible (sin fusionar ni rechazar)', () => {
    const r = agregarValidado(base(), entrada({ nombre: ' TOMATE ', cantidad: '3', unidad: 'unidad', vence: en(9) }), 'n1')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.despensa).toHaveLength(3)
      expect(r.despensa.filter((i) => i.nombre.trim().toLowerCase() === 'tomate')).toHaveLength(2)
      expect(cantidadDisponible(r.despensa, 'tomate', 'unidad', HOY)).toBe(7)
    }
  })

  it('una fecha pasada se acepta (queda como vencido)', () => {
    expect(agregarValidado(base(), entrada({ vence: en(-3) }), 'n1').ok).toBe(true)
  })
})

describe('editarValidado (R1)', () => {
  it('cambia solo ese lote y conserva el id', () => {
    const r = editarValidado(base(), 'a', entrada({ nombre: 'Tomate chonto', cantidad: '1,5', unidad: 'kg' }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.despensa[0]).toEqual({ id: 'a', nombre: 'Tomate chonto', cantidad: 1.5, unidad: 'kg', vence: en(5) })
      expect(r.despensa[1]).toEqual(base()[1])
      expect(r.despensa).toHaveLength(2)
    }
  })

  it('con datos inválidos no cambia nada', () => {
    const r = editarValidado(base(), 'a', entrada({ cantidad: '-1', vence: '2026-02-31' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['cantidad', 'vence'])
  })

  it('un id que no existe da error general (p. ej. borrado desde otra pestaña)', () => {
    const r = editarValidado(base(), 'zzz', entrada())
    expect(r).toEqual({ ok: false, errores: { general: 'Ese ingrediente ya no existe.' } })
  })
})

describe('usarIngrediente: acción "usé"', () => {
  it('descuenta la cantidad y conserva el resto del lote', () => {
    const r = usarIngrediente(base(), 'a', '1')
    expect(r.ok && r.restante).toBe(3)
    if (r.ok) {
      expect(r.eliminado).toBe(false)
      expect(r.despensa[0]).toEqual({ id: 'a', nombre: 'Tomate', cantidad: 3, unidad: 'unidad', vence: en(1) })
      expect(r.despensa[1]).toEqual(base()[1])
    }
  })

  it('acepta coma decimal ("0,5") y no deja ruido de flotantes (0,3 − 0,1 = 0,2 exacto)', () => {
    const d = [ing('Aceite', 0.3, 'l', en(30), 'x')]
    const r = usarIngrediente(d, 'x', '0,1')
    expect(r.ok && r.restante).toBe(0.2)
    expect(usarIngrediente(base(), 'b', '0,5').ok).toBe(true)
  })

  it('DECISIÓN: al llegar exactamente a 0, el lote se ELIMINA', () => {
    const r = usarIngrediente(base(), 'a', 4)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.eliminado).toBe(true)
      expect(r.restante).toBe(0)
      expect(r.despensa.map((i) => i.id)).toEqual(['b'])
    }
  })

  it('llegar a 0 por decimales (0,1 + 0,2 usados de 0,3) también elimina', () => {
    const d = [ing('Aceite', 0.3, 'l', en(30), 'x')]
    const paso1 = usarIngrediente(d, 'x', '0,1')
    expect(paso1.ok).toBe(true)
    if (!paso1.ok) return
    const paso2 = usarIngrediente(paso1.despensa, 'x', '0,2')
    expect(paso2.ok && paso2.eliminado).toBe(true)
  })

  it('el resultado nunca deja un lote con cantidad inválida: la lista se puede guardar y leer', () => {
    const r = usarIngrediente(base(), 'a', 4)
    expect(r.ok).toBe(true)
    if (r.ok) expect(leerDespensa(serializarDespensa(r.despensa)).estado).toBe('ok')
  })

  it('NO permite usar más de lo que hay (mensaje con lo que tiene) y no modifica nada', () => {
    const d = base()
    const r = usarIngrediente(d, 'a', 5)
    expect(r).toEqual({ ok: false, error: 'No puedes usar más de lo que tienes (tienes 4 unidades).' })
    expect(usarIngrediente(d, 'a', '4,0001').ok).toBe(false)
    expect(d).toEqual(base())
  })

  it.each<[string, unknown, RegExp]>([
    ['vacío', '', /obligatoria/],
    ['cero', 0, /mayor que 0/],
    ['negativo', '-2', /mayor que 0/],
    ['texto', 'abc', /número/],
    ['NaN', NaN, /número/],
    ['Infinity', Infinity, /finito/],
    ['1e9', 1e9, /demasiado grande/],
  ])('valor inválido (%s) se rechaza con mensaje', (_n, valor, mensaje) => {
    const r = usarIngrediente(base(), 'a', valor)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(mensaje)
  })

  it('un id que no existe da error', () => {
    expect(usarIngrediente(base(), 'zzz', 1)).toEqual({ ok: false, error: 'Ese ingrediente ya no existe.' })
  })

  it('el descuento se refleja en cantidadDisponible (y por tanto en las recetas)', () => {
    const r = usarIngrediente(base(), 'a', 3)
    expect(r.ok && cantidadDisponible(r.despensa, 'tomate', 'unidad', HOY)).toBe(1)
  })
})

describe('cantidadATexto (para editar sin perder datos)', () => {
  it('ida y vuelta exacta con validarCantidad', () => {
    for (const n of [1, 2.5, 0.0001, 0.0000001, 100000, 0.1 + 0.2, 1234.5678]) {
      const t = cantidadATexto(n)
      expect(t).not.toMatch(/e/i)
      expect(validarCantidad(t)).toEqual({ ok: true, valor: n })
    }
    expect(cantidadATexto(2.5)).toBe('2,5')
  })
})
