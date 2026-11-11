import { formatearCantidad } from '../domain/presentacion'
import type { Ingrediente } from '../domain/tipos'

interface Props {
  ingrediente: Ingrediente
  onConfirmar: () => void
  onCancelar: () => void
}

/** Confirmación propia de la app (no usa window.confirm). */
export function ConfirmarBorrado({ ingrediente, onConfirmar, onCancelar }: Props) {
  return (
    <div role="alertdialog" aria-label={`Confirmar borrado de ${ingrediente.nombre}`} className="space-y-2 rounded-xl border-2 border-red-300 bg-white p-3">
      <p className="font-semibold">
        ¿Borrar {ingrediente.nombre} ({formatearCantidad(ingrediente.cantidad, ingrediente.unidad)})?
      </p>
      <p className="text-sm text-stone-600">Esta acción no se puede deshacer.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onConfirmar} className="min-h-11 flex-1 rounded-xl bg-red-700 px-4 font-semibold text-white">
          Sí, borrar
        </button>
        <button type="button" autoFocus onClick={onCancelar} className="min-h-11 rounded-xl bg-white px-4 font-semibold ring-1 ring-stone-300">
          Cancelar
        </button>
      </div>
    </div>
  )
}
