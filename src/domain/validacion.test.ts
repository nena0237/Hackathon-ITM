import { describe, expect, it } from 'vitest'
import { normalizarNombre } from './nombres'
import { en, HOY } from './pruebas-util'
import { MAX_CANTIDAD, MAX_LARGO_NOMBRE, validarCantidad, validarIngrediente } from './validacion'
import type { IngredienteEntrada } from './tipos'

const base: IngredienteEntrada = { nombre: 'Tomate', cantidad: 2, unidad: 'unidad', vence: en(3) }
const con = (campos: Partial<IngredienteEntrada>): IngredienteEntrada => ({ ...base, ...campos })

function errorDe(entrada: IngredienteEntrada, campo: 'nombre' | 'cantidad' | 'unidad' | 'vence'): string | undefined {
  const r = validarIngrediente(entrada)
  return r.ok ? undefined : r.errores[campo]
}

describe('grupo 1: cantidad', () => {
  it.each<[string, unknown, RegExp]>([
    ['vacía', '', /obligatoria/],
    ['solo espacios', '   ', /obligatoria/],
    ['undefined', undefined, /obligatoria/],
    ['null', null, /obligatoria/],
    ['cero', 0, /mayor que 0/],
    ['cero en texto', '0', /mayor que 0/],
    ['cero decimal', '0,0', /mayor que 0/],
    ['negativa', -3, /mayor que 0/],
    ['negativa en texto', '-3', /mayor que 0/],
    ['texto "abc"', 'abc', /número/],
    ['mezcla "3 kilos"', '3 kilos', /número/],
    ['NaN', NaN, /número/],
    ['Infinity', Infinity, /finito/],
    ['-Infinity', -Infinity, /finito/],
    ['1e9 como número', 1e9, /demasiado grande/],
    ['1e9 como texto', '1e9', /número/],
    ['justo sobre el máximo', MAX_CANTIDAD + 1, /demasiado grande/],
    ['hexadecimal', '0x10', /número/],
    ['dos puntos decimales', '1.2.3', /número/],
    ['coma y punto', '2,5,1', /número/],
    ['booleano', true, /obligatoria/],
  ])('rechaza %s con mensaje claro', (_nombre, valor, mensaje) => {
    const r = validarCantidad(valor)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(mensaje)
  })

  it.each<[string, unknown, number]>([
    ['0.0001 (muy pequeña pero positiva)', 0.0001, 0.0001],
    ['"0.0001" en texto', '0.0001', 0.0001],
    ['"2,5" con coma decimal', '2,5', 2.5],
    ['"2.5" con punto', '2.5', 2.5],
    ['" 3 " con espacios', ' 3 ', 3],
    ['entero', 1, 1],
    ['exactamente el máximo', MAX_CANTIDAD, MAX_CANTIDAD],
    ['",5" sin cero inicial', ',5', 0.5],
  ])('acepta %s', (_nombre, valor, esperado) => {
    const r = validarCantidad(valor)
    expect(r).toEqual({ ok: true, valor: esperado })
  })

  it('validarIngrediente guarda la cantidad ya convertida a número ("2,5" → 2.5)', () => {
    const r = validarIngrediente(con({ cantidad: '2,5' }))
    expect(r.ok && r.valor.cantidad).toBe(2.5)
  })

  it('validarIngrediente reporta el error de cantidad bajo el campo "cantidad"', () => {
    expect(errorDe(con({ cantidad: 0 }), 'cantidad')).toMatch(/mayor que 0/)
    expect(errorDe(con({ cantidad: 1e9 }), 'cantidad')).toMatch(/demasiado grande/)
  })
})

describe('grupo 2: nombre', () => {
  it('rechaza vacío, solo espacios y valores que no son texto', () => {
    for (const nombre of ['', '   ', '\t\n', undefined, null, 42]) {
      expect(errorDe(con({ nombre }), 'nombre')).toMatch(/obligatorio/)
    }
  })

  it('rechaza 200 caracteres con mensaje que menciona el máximo', () => {
    const msg = errorDe(con({ nombre: 'a'.repeat(200) }), 'nombre')
    expect(msg).toMatch(/muy largo/)
    expect(msg).toContain(String(MAX_LARGO_NOMBRE))
  })

  it('el límite es 60: 60 caracteres pasan, 61 no', () => {
    expect(validarIngrediente(con({ nombre: 'a'.repeat(60) })).ok).toBe(true)
    expect(validarIngrediente(con({ nombre: 'a'.repeat(61) })).ok).toBe(false)
  })

  it('el límite se mide sin los espacios sobrantes de los bordes', () => {
    expect(validarIngrediente(con({ nombre: `  ${'a'.repeat(60)}  ` })).ok).toBe(true)
  })

  it('conserva tildes y mayúsculas para mostrar, pero limpia espacios', () => {
    const r = validarIngrediente(con({ nombre: '  Harina   de MAÍZ ' }))
    expect(r.ok && r.valor.nombre).toBe('Harina de MAÍZ')
  })

  it('normalizarNombre: "Tomate" = "tomate" = " TOMATE "', () => {
    expect(normalizarNombre('Tomate')).toBe('tomate')
    expect(normalizarNombre(' TOMATE ')).toBe('tomate')
    expect(normalizarNombre('tomate')).toBe('tomate')
  })

  it('normalizarNombre quita tildes y espacios internos repetidos', () => {
    expect(normalizarNombre('Harina  de   MAÍZ')).toBe('harina de maiz')
    expect(normalizarNombre('Limón')).toBe('limon')
    expect(normalizarNombre('Pollo')).not.toBe(normalizarNombre('Pollos'))
  })

  it('normalizarNombre conserva la ñ (piña no es pina), venga precompuesta o descompuesta', () => {
    expect(normalizarNombre('PIÑA')).toBe('piña')
    expect(normalizarNombre('piña')).not.toBe(normalizarNombre('pina'))
    expect(normalizarNombre('piña')).toBe('piña')
    expect(normalizarNombre('Añejo ÁÉÍÓÚ')).toBe('añejo aeiou')
  })

  it('normalizarNombre no altera nombres con símbolos o números (sin marcadores internos)', () => {
    expect(normalizarNombre('Mix 0001 #1')).toBe('mix 0001 #1')
  })

  it('duplicado exacto: es válido (se guarda como otro lote, no se rechaza)', () => {
    const a = validarIngrediente(con({}))
    const b = validarIngrediente(con({}))
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
  })
})

describe('grupo 3: fecha', () => {
  it('vacía → obligatoria', () => {
    for (const vence of ['', '   ', undefined, null]) {
      expect(errorDe(con({ vence }), 'vence')).toMatch(/obligatoria/)
    }
  })

  it.each(['mañana', '15/03/2026', '2026-3-5', '20260315', '2026-03-15T10:00', 20260315])(
    'formato inválido %s → mensaje de fecha no válida',
    (vence) => {
      expect(errorDe(con({ vence }), 'vence')).toMatch(/no es válida/)
    },
  )

  it('31 de febrero y otros días inexistentes se rechazan', () => {
    for (const vence of ['2026-02-31', '2026-04-31', '2026-02-29', '2026-13-01']) {
      expect(errorDe(con({ vence }), 'vence')).toMatch(/no es válida/)
    }
  })

  it('ayer, hoy, mañana y dentro de 10 años se aceptan y se guardan tal cual', () => {
    for (const vence of [en(-1), HOY, en(1), '2036-03-15']) {
      const r = validarIngrediente(con({ vence }))
      expect(r.ok && r.valor.vence).toBe(vence)
    }
  })
})

describe('unidad y errores combinados', () => {
  it('acepta las 5 unidades y rechaza las demás', () => {
    for (const unidad of ['g', 'kg', 'ml', 'l', 'unidad']) {
      expect(validarIngrediente(con({ unidad })).ok).toBe(true)
    }
    for (const unidad of ['taza', '', 'KG', undefined, null]) {
      expect(errorDe(con({ unidad }), 'unidad')).toMatch(/unidad válida/)
    }
  })

  it('reporta todos los campos malos a la vez, y solo esos', () => {
    const r = validarIngrediente({ nombre: '', cantidad: -1, unidad: 'taza', vence: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['cantidad', 'nombre', 'unidad', 'vence'])
  })

  it('un solo campo malo no marca los demás', () => {
    const r = validarIngrediente(con({ cantidad: 0 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores)).toEqual(['cantidad'])
  })
})
