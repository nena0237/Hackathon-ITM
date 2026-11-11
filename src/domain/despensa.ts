import { formatearCantidad } from './presentacion'
import { validarCantidad, validarIngrediente } from './validacion'
import { diasParaVencer, esVencido } from './fechas'
import { normalizarNombre } from './nombres'
import type { Fecha, Ingrediente, IngredienteEntrada, IngredienteValido, ResultadoDespensa, ResultadoUso, Unidad } from './tipos'
import { convertirUnidad, redondear } from './unidades'

/** Orden ascendente por fecha de vencimiento; desempate por nombre. No muta la entrada. */
export function ordenarPorVencimiento<T extends { nombre: string; vence: Fecha }>(lista: readonly T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      diasParaVencer(a.vence, b.vence) ||
      normalizarNombre(a.nombre).localeCompare(normalizarNombre(b.nombre), 'es'),
  )
}

/** Separa vigentes (incluye los que vencen hoy) de vencidos; ambos ordenados por vencimiento. */
export function separarVencidos<T extends { nombre: string; vence: Fecha }>(
  lista: readonly T[],
  hoy: Fecha,
): { vigentes: T[]; vencidos: T[] } {
  const ordenada = ordenarPorVencimiento(lista)
  return {
    vigentes: ordenada.filter((i) => !esVencido(i.vence, hoy)),
    vencidos: ordenada.filter((i) => esVencido(i.vence, hoy)),
  }
}

/**
 * Suma, en la unidad pedida, los lotes NO vencidos del ingrediente.
 * Los lotes con unidad incompatible no suman.
 */
export function cantidadDisponible(
  despensa: readonly Ingrediente[],
  nombre: string,
  unidad: Unidad,
  hoy: Fecha,
): number {
  const clave = normalizarNombre(nombre)
  let total = 0
  for (const lote of despensa) {
    if (normalizarNombre(lote.nombre) !== clave || esVencido(lote.vence, hoy)) continue
    const c = convertirUnidad(lote.cantidad, lote.unidad, unidad)
    if (c !== null) total += c
  }
  return redondear(total)
}

// Operaciones inmutables sobre la despensa. El id lo provee quien llama (sin azar en el dominio).
export function agregarIngrediente(despensa: readonly Ingrediente[], valor: IngredienteValido, id: string): Ingrediente[] {
  return [...despensa, { id, ...valor }]
}

export function actualizarIngrediente(
  despensa: readonly Ingrediente[],
  id: string,
  valor: IngredienteValido,
): Ingrediente[] {
  return despensa.map((i) => (i.id === id ? { id, ...valor } : i))
}

export function eliminarIngrediente(despensa: readonly Ingrediente[], id: string): Ingrediente[] {
  return despensa.filter((i) => i.id !== id)
}

/** Valida la entrada y agrega el ingrediente. Un nombre repetido se guarda como OTRO lote (no se fusiona). */
export function agregarValidado(despensa: readonly Ingrediente[], entrada: IngredienteEntrada, id: string): ResultadoDespensa {
  const v = validarIngrediente(entrada)
  if (!v.ok) return { ok: false, errores: v.errores }
  return { ok: true, despensa: agregarIngrediente(despensa, v.valor, id) }
}

/** Valida la entrada y actualiza el ingrediente con ese id. */
export function editarValidado(despensa: readonly Ingrediente[], id: string, entrada: IngredienteEntrada): ResultadoDespensa {
  if (!despensa.some((i) => i.id === id)) return { ok: false, errores: { general: 'Ese ingrediente ya no existe.' } }
  const v = validarIngrediente(entrada)
  if (!v.ok) return { ok: false, errores: v.errores }
  return { ok: true, despensa: actualizarIngrediente(despensa, id, v.valor) }
}

/**
 * Acción "usé": descuenta `usada` (en la unidad del lote) de ese lote.
 * Decisión: si llega exactamente a 0, el lote se ELIMINA (una cantidad 0 es inválida en el dominio).
 * No permite descontar más de lo que hay ni valores inválidos (0, negativos, texto, NaN, Infinity).
 */
export function usarIngrediente(despensa: readonly Ingrediente[], id: string, usada: unknown): ResultadoUso {
  const lote = despensa.find((i) => i.id === id)
  if (!lote) return { ok: false, error: 'Ese ingrediente ya no existe.' }
  const c = validarCantidad(usada)
  if (!c.ok) return { ok: false, error: c.error }
  const restante = redondear(lote.cantidad - c.valor)
  if (restante < 0)
    return { ok: false, error: `No puedes usar más de lo que tienes (tienes ${formatearCantidad(lote.cantidad, lote.unidad)}).` }
  if (restante === 0) return { ok: true, despensa: eliminarIngrediente(despensa, id), eliminado: true, restante: 0 }
  return { ok: true, despensa: despensa.map((i) => (i.id === id ? { ...i, cantidad: restante } : i)), eliminado: false, restante }
}
