import { diasParaVencer, esVencido } from './fechas'
import { normalizarNombre } from './nombres'
import type { Fecha, Ingrediente, IngredienteValido, Unidad } from './tipos'
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
