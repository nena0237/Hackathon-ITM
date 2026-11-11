import { capitalizarNombre } from '../domain/formato'
import { formatearCantidad } from '../domain/presentacion'
import type { Ingrediente } from '../domain/tipos'

interface Props {
  ingrediente: Ingrediente
  onConfirmar: () => void
  onCancelar: () => void
}

/** Contenido de la confirmación de borrado (vive dentro de la hoja; no usa window.confirm). */
export function ConfirmarBorrado({ ingrediente, onConfirmar, onCancelar }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">
        {capitalizarNombre(ingrediente.nombre)} ({formatearCantidad(ingrediente.cantidad, ingrediente.unidad)}) saldrá de tu despensa.
      </p>
      <p className="text-base text-tinta-suave">Esta acción no se puede deshacer.</p>
      <div className="flex gap-3">
        <button type="button" onClick={onConfirmar} className="min-h-12 flex-1 rounded-2xl bg-coral px-4 text-base font-semibold">
          Sí, borrar
        </button>
        <button type="button" onClick={onCancelar} className="min-h-12 rounded-2xl border-2 border-tinta px-5 text-base font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  )
}
