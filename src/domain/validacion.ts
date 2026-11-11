import { esFechaValida } from './fechas'
import type { CampoIngrediente, IngredienteEntrada, ResultadoValidacion, Unidad } from './tipos'
import { UNIDADES } from './tipos'

export const MAX_LARGO_NOMBRE = 60
export const MAX_CANTIDAD = 100000

export type ResultadoCantidad = { ok: true; valor: number } | { ok: false; error: string }

/** Decimal con punto o coma. Sin notación científica, sin hex, sin separadores de miles. */
const NUMERO = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/

/**
 * Cantidad válida: número finito, mayor que 0 y hasta MAX_CANTIDAD.
 * En texto acepta coma decimal ("2,5" → 2.5).
 */
export function validarCantidad(valor: unknown): ResultadoCantidad {
  let n: number
  if (typeof valor === 'number') {
    n = valor
  } else if (typeof valor === 'string') {
    const t = valor.trim()
    if (t === '') return { ok: false, error: 'La cantidad es obligatoria.' }
    if (!NUMERO.test(t)) return { ok: false, error: 'La cantidad debe ser un número (ej. 2 o 2,5).' }
    n = Number(t.replace(',', '.'))
  } else {
    return { ok: false, error: 'La cantidad es obligatoria.' }
  }
  if (Number.isNaN(n)) return { ok: false, error: 'La cantidad debe ser un número.' }
  if (!Number.isFinite(n)) return { ok: false, error: 'La cantidad debe ser un número finito.' }
  if (n <= 0) return { ok: false, error: 'La cantidad debe ser mayor que 0.' }
  if (n > MAX_CANTIDAD) return { ok: false, error: `La cantidad es demasiado grande (máximo ${MAX_CANTIDAD}).` }
  return { ok: true, valor: n }
}

/**
 * Valida un ingrediente. Una fecha pasada ES válida (sirve para registrar algo ya vencido).
 * Un nombre repetido también es válido: se guarda como otro lote.
 */
export function validarIngrediente(entrada: IngredienteEntrada): ResultadoValidacion {
  const errores: Partial<Record<CampoIngrediente, string>> = {}

  const nombre = typeof entrada.nombre === 'string' ? entrada.nombre.trim().replace(/\s+/g, ' ') : ''
  if (nombre === '') errores.nombre = 'El nombre es obligatorio.'
  else if (nombre.length > MAX_LARGO_NOMBRE)
    errores.nombre = `El nombre es muy largo (máximo ${MAX_LARGO_NOMBRE} caracteres).`

  const cant = validarCantidad(entrada.cantidad)
  if (!cant.ok) errores.cantidad = cant.error

  if (!UNIDADES.includes(entrada.unidad as Unidad)) errores.unidad = 'Elige una unidad válida.'

  if (entrada.vence == null || (typeof entrada.vence === 'string' && entrada.vence.trim() === ''))
    errores.vence = 'La fecha de vencimiento es obligatoria.'
  else if (!esFechaValida(entrada.vence)) errores.vence = 'La fecha no es válida (usa AAAA-MM-DD, ej. 2026-03-15).'

  if (!cant.ok || Object.keys(errores).length > 0) return { ok: false, errores }
  return {
    ok: true,
    valor: { nombre, cantidad: cant.valor, unidad: entrada.unidad as Unidad, vence: entrada.vence as string },
  }
}
