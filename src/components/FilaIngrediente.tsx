import type { ReactNode } from 'react'
import { diasParaVencer, estadoVencimiento } from '../domain/fechas'
import { describirVencimiento, formatearCantidad, formatearFecha } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import { Insignia } from './Insignia'

const FONDO = {
  vencido: 'border-red-300 bg-red-50',
  'por-vencer': 'border-amber-400 bg-amber-50',
  vigente: 'border-stone-200 bg-white',
} as const

interface Props {
  ingrediente: Ingrediente
  hoy: Fecha
  /** Botones de acción (usé, editar, borrar). */
  acciones?: ReactNode
  /** Panel que se abre bajo la fila (formulario, confirmación…). */
  panel?: ReactNode
}

export function FilaIngrediente({ ingrediente, hoy, acciones, panel }: Props) {
  const estado = estadoVencimiento(ingrediente.vence, hoy)
  const dias = diasParaVencer(ingrediente.vence, hoy)
  return (
    <li className={`rounded-xl border-2 px-4 py-3 ${FONDO[estado]}`} data-estado={estado} data-id={ingrediente.id} data-nombre={ingrediente.nombre}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{ingrediente.nombre}</p>
          <p className="text-sm text-stone-600">{formatearCantidad(ingrediente.cantidad, ingrediente.unidad)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <Insignia estado={estado} />
          <p className="text-sm font-medium">{describirVencimiento(dias)}</p>
          <p className="text-xs text-stone-500">{formatearFecha(ingrediente.vence)}</p>
        </div>
      </div>
      {acciones && <div className="mt-2 flex flex-wrap gap-2">{acciones}</div>}
      {panel && <div className="mt-2">{panel}</div>}
    </li>
  )
}
