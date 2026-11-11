import { cantidadDisponible } from './despensa'
import { diasParaVencer, esPorVencer, esVencido } from './fechas'
import { normalizarNombre } from './nombres'
import type { Faltante, Fecha, Ingrediente, IngredienteAprovechado, MotivoFaltante, Receta, Sugerencia } from './tipos'
import { redondear, sonCompatibles } from './unidades'

/**
 * Clasifica cada receta en cocinable/parcial. Nunca usa lotes vencidos.
 * Orden: cocinables primero; luego más urgencia aprovechada, menos faltantes, nombre.
 */
export function sugerirRecetas(recetas: readonly Receta[], despensa: readonly Ingrediente[], hoy: Fecha): Sugerencia[] {
  const sugerencias = recetas.map((receta): Sugerencia => {
    const faltantes: Faltante[] = []
    const aprovecha: IngredienteAprovechado[] = []

    for (const ing of receta.ingredientes) {
      const clave = normalizarNombre(ing.nombre)
      const lotes = despensa.filter((l) => normalizarNombre(l.nombre) === clave)
      const vigentes = lotes.filter((l) => !esVencido(l.vence, hoy))
      const utiles = vigentes.filter((l) => sonCompatibles(l.unidad, ing.unidad))

      const disponible = cantidadDisponible(despensa, ing.nombre, ing.unidad, hoy)
      if (disponible < ing.cantidad) {
        let motivo: MotivoFaltante
        if (utiles.length > 0) motivo = 'insuficiente'
        else if (vigentes.length > 0) motivo = 'unidad-incompatible'
        else if (lotes.length > 0) motivo = 'vencido'
        else motivo = 'no-hay'
        faltantes.push({
          nombre: ing.nombre,
          unidad: ing.unidad,
          necesita: ing.cantidad,
          disponible,
          falta: redondear(ing.cantidad - disponible),
          motivo,
        })
      }

      const urgentes = utiles.filter((l) => esPorVencer(l.vence, hoy))
      if (urgentes.length > 0) {
        aprovecha.push({ nombre: ing.nombre, dias: Math.min(...urgentes.map((l) => diasParaVencer(l.vence, hoy))) })
      }
    }

    return {
      receta,
      estado: faltantes.length === 0 ? 'cocinable' : 'parcial',
      faltantes,
      aprovecha,
      urgencia: aprovecha.length,
    }
  })

  return sugerencias.sort(
    (a, b) =>
      Number(b.estado === 'cocinable') - Number(a.estado === 'cocinable') ||
      b.urgencia - a.urgencia ||
      a.faltantes.length - b.faltantes.length ||
      a.receta.nombre.localeCompare(b.receta.nombre, 'es'),
  )
}
