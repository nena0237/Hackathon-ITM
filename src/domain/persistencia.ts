import { esFechaValida } from './fechas'
import type { Ingrediente, Unidad } from './tipos'
import { UNIDADES } from './tipos'
import { MAX_LARGO_NOMBRE, validarCantidad } from './validacion'

export const VERSION_DATOS = 1

export type ResultadoLectura =
  /** `descartados`: registros inválidos que se dejaron fuera (los demás se conservan). */
  | { estado: 'ok'; ingredientes: Ingrediente[]; descartados: number }
  | { estado: 'vacio' }
  | { estado: 'corrupto' | 'formato-viejo'; motivo: string }

/** Texto que la capa de storage guardará bajo `foodsaver:v1` (el storage real es de la Fase 2). */
export function serializarDespensa(ingredientes: readonly Ingrediente[]): string {
  return JSON.stringify({ version: VERSION_DATOS, ingredientes })
}

function ingredienteValido(x: unknown): x is Ingrediente {
  if (typeof x !== 'object' || x === null) return false
  const i = x as Record<string, unknown>
  return (
    typeof i.id === 'string' &&
    i.id !== '' &&
    typeof i.nombre === 'string' &&
    i.nombre.trim() !== '' &&
    i.nombre.length <= MAX_LARGO_NOMBRE &&
    typeof i.cantidad === 'number' &&
    validarCantidad(i.cantidad).ok &&
    UNIDADES.includes(i.unidad as Unidad) &&
    esFechaValida(i.vence)
  )
}

/** Interpreta lo guardado sin lanzar jamás. null → vacío; basura o formato viejo → aviso para el llamador. */
export function leerDespensa(texto: string | null): ResultadoLectura {
  if (texto === null) return { estado: 'vacio' }
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    return { estado: 'corrupto', motivo: 'El texto guardado no es JSON válido.' }
  }
  if (Array.isArray(datos)) return { estado: 'formato-viejo', motivo: 'Formato anterior sin versión.' }
  if (typeof datos !== 'object' || datos === null) return { estado: 'corrupto', motivo: 'Estructura inesperada.' }
  const d = datos as Record<string, unknown>
  if (d.version !== VERSION_DATOS) return { estado: 'formato-viejo', motivo: `Versión ${String(d.version)} no soportada.` }
  if (!Array.isArray(d.ingredientes)) return { estado: 'corrupto', motivo: 'Ingredientes con datos inválidos.' }
  const validos = d.ingredientes.filter(ingredienteValido)
  const descartados = d.ingredientes.length - validos.length
  // Si había registros y ninguno sirve, no hay nada que rescatar: se trata como dañado.
  if (descartados > 0 && validos.length === 0) return { estado: 'corrupto', motivo: 'Ingredientes con datos inválidos.' }
  return { estado: 'ok', ingredientes: conIdsUnicos(validos), descartados }
}

/**
 * Los ids repetidos (solo pasa con datos editados a mano) harían que editar o borrar uno afectara a
 * otro. El primero conserva su id; los repetidos reciben `id-2`, `id-3`… (sin azar: el dominio es puro).
 */
function conIdsUnicos(lista: Ingrediente[]): Ingrediente[] {
  const usados = new Set(lista.map((i) => i.id))
  const vistos = new Set<string>()
  return lista.map((i) => {
    if (!vistos.has(i.id)) {
      vistos.add(i.id)
      return i
    }
    let n = 2
    while (usados.has(`${i.id}-${n}`)) n += 1
    const id = `${i.id}-${n}`
    usados.add(id)
    vistos.add(id)
    return { ...i, id }
  })
}
