import type { Unidad } from './tipos'

type Familia = 'masa' | 'volumen' | 'unidad'

const FAMILIA: Record<Unidad, Familia> = { g: 'masa', kg: 'masa', ml: 'volumen', l: 'volumen', unidad: 'unidad' }
/** Factor para pasar a la unidad base de la familia (g, ml, unidad). */
const A_BASE: Record<Unidad, number> = { g: 1, kg: 1000, ml: 1, l: 1000, unidad: 1 }

/** Quita ruido de punto flotante (1.1 kg → 1100 g exactos). */
export function redondear(n: number): number {
  return Math.round(n * 1e9) / 1e9
}

export function sonCompatibles(a: Unidad, b: Unidad): boolean {
  return FAMILIA[a] === FAMILIA[b]
}

/** Convierte solo g↔kg y ml↔l. Devuelve null si las unidades son incompatibles. */
export function convertirUnidad(cantidad: number, de: Unidad, a: Unidad): number | null {
  if (!sonCompatibles(de, a)) return null
  if (de === a) return cantidad
  return redondear((cantidad * A_BASE[de]) / A_BASE[a])
}
