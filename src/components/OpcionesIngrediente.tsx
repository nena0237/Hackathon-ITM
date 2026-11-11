import { diasParaVencer } from '../domain/fechas'
import { capitalizarNombre, textoRelativo } from '../domain/formato'
import { formatearCantidad } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import { IconoBorrar, IconoEditar, IconoUsar } from './Iconos'

interface Props {
  ingrediente: Ingrediente
  hoy: Fecha
  /** "Usé" solo se ofrece para lotes vigentes. */
  puedeUsar: boolean
  onUsar: () => void
  onEditar: () => void
  onBorrar: () => void
}

const GRANDE = 'flex min-h-14 w-full items-center gap-3 rounded-2xl px-5 text-lg font-semibold'

export function OpcionesIngrediente({ ingrediente, hoy, puedeUsar, onUsar, onEditar, onBorrar }: Props) {
  const nombre = capitalizarNombre(ingrediente.nombre)
  return (
    <div className="space-y-3">
      <p className="text-base text-tinta-suave">
        {formatearCantidad(ingrediente.cantidad, ingrediente.unidad)} · {textoRelativo(diasParaVencer(ingrediente.vence, hoy))}
      </p>
      {puedeUsar && (
        <button type="button" className={`${GRANDE} bg-lima`} aria-label={`Usé ${nombre}`} onClick={onUsar}>
          <IconoUsar /> Usé
        </button>
      )}
      <button type="button" className={`${GRANDE} border-2 border-tinta`} aria-label={`Editar ${nombre}`} onClick={onEditar}>
        <IconoEditar /> Editar
      </button>
      <button type="button" className={`${GRANDE} bg-coral`} aria-label={`Borrar ${nombre}`} onClick={onBorrar}>
        <IconoBorrar /> Borrar
      </button>
    </div>
  )
}
