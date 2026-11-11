import { sumarDias } from '../domain/fechas'
import type { Fecha, Ingrediente } from '../domain/tipos'

/**
 * Ingredientes de ejemplo. Las fechas son SIEMPRE relativas a `hoy` (nunca fijas),
 * para que los vencidos y los "por vencer" de la demo no se desactualicen.
 */
export function crearSeed(hoy: Fecha): Ingrediente[] {
  const fila = (id: string, nombre: string, cantidad: number, unidad: Ingrediente['unidad'], dias: number): Ingrediente => ({
    id: `seed-${id}`,
    nombre,
    cantidad,
    unidad,
    vence: sumarDias(hoy, dias),
  })
  return [
    fila('leche', 'Leche', 1, 'l', -1), // vencido
    fila('tomate', 'Tomate', 4, 'unidad', 1),
    fila('huevos', 'Huevos', 6, 'unidad', 2),
    fila('queso', 'Queso', 250, 'g', 3),
    fila('pollo', 'Pollo', 500, 'g', 0), // borde: vence hoy, NO vencido
    fila('cebolla', 'Cebolla', 2, 'unidad', 7),
    fila('arroz', 'Arroz', 500, 'g', 180),
    fila('harina', 'Harina de maíz', 1, 'kg', 120),
    fila('arroz-vencido', 'Arroz', 250, 'g', -5), // lote vencido del mismo ingrediente
  ]
}
