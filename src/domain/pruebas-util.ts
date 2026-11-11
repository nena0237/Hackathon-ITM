// Utilidades SOLO para tests (no se importa desde la app).
import type { Ingrediente, Receta, RecetaIngrediente, Unidad } from './tipos'

export const HOY = '2026-03-15'

/** Fecha = HOY + n días, calculada con UTC para que no dependa de la zona horaria de la máquina. */
export function en(n: number, base = HOY): string {
  const [a, m, d] = base.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10)
}

let contador = 0
export function ing(nombre: string, cantidad: number, unidad: Unidad, vence: string, id?: string): Ingrediente {
  contador += 1
  return { id: id ?? `t${contador}`, nombre, cantidad, unidad, vence }
}

export function rec(nombre: string, ingredientes: RecetaIngrediente[]): Receta {
  return { id: nombre.toLowerCase().replace(/\s+/g, '-'), nombre, ingredientes, instrucciones: 'Mezclar y cocinar.' }
}

export function ri(nombre: string, cantidad: number, unidad: Unidad): RecetaIngrediente {
  return { nombre, cantidad, unidad }
}
