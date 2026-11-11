import { fechaLocalISO } from '../domain/fechas'
import type { Fecha } from '../domain/tipos'

/**
 * Único lugar donde se lee el reloj. Devuelve la fecha LOCAL de hoy (YYYY-MM-DD);
 * el dominio la recibe siempre como parámetro.
 */
export function hoyLocal(ahora: Date = new Date()): Fecha {
  return fechaLocalISO(ahora)
}
