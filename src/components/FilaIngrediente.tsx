import { diasParaVencer, estadoVencimiento } from '../domain/fechas'
import { describirVencimiento, formatearCantidad, formatearFecha } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import { Insignia } from './Insignia'

const FONDO = {
  vencido: 'border-red-300 bg-red-50',
  'por-vencer': 'border-amber-400 bg-amber-50',
  vigente: 'border-stone-200 bg-white',
} as const

export function FilaIngrediente({ ingrediente, hoy }: { ingrediente: Ingrediente; hoy: Fecha }) {
  const estado = estadoVencimiento(ingrediente.vence, hoy)
  const dias = diasParaVencer(ingrediente.vence, hoy)
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${FONDO[estado]}`}
      data-estado={estado}
    >
      <div className="min-w-0">
        <p className="truncate text-base font-semibold">{ingrediente.nombre}</p>
        <p className="text-sm text-stone-600">{formatearCantidad(ingrediente.cantidad, ingrediente.unidad)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <Insignia estado={estado} />
        <p className="text-sm font-medium">{describirVencimiento(dias)}</p>
        <p className="text-xs text-stone-500">{formatearFecha(ingrediente.vence)}</p>
      </div>
    </li>
  )
}
