import type { CSSProperties } from 'react'
import { diasParaVencer, estadoVencimiento } from '../domain/fechas'
import { capitalizarNombre, fechaCorta, nivelUrgencia, posicionEscalonada, textoRelativoCorto } from '../domain/formato'
import { formatearCantidad } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import { useRevealUnaVez } from '../hooks/useReveal'
import { IconoNivel, IconoX } from './Iconos'

interface Props {
  ingrediente: Ingrediente
  hoy: Fecha
  /** Posición dentro de su sección (escalona la entrada; solo los 8 primeros). */
  indice: number
  /** Secciones compactas: nombre de 18 px en lugar de 24 px. */
  compacta?: boolean
  onAbrir: (boton: HTMLElement) => void
}

/** Una fila de la línea de tiempo: fecha · línea con nodo · banda de color. */
export function FilaTiempo({ ingrediente, hoy, indice, compacta = false, onAbrir }: Props) {
  const { ref, visible } = useRevealUnaVez<HTMLLIElement>()
  const dias = diasParaVencer(ingrediente.vence, hoy)
  const nivel = nivelUrgencia(dias)
  const vencido = nivel === 'vencido'
  const fecha = fechaCorta(ingrediente.vence, hoy)
  const nombre = capitalizarNombre(ingrediente.nombre)
  const cantidad = formatearCantidad(ingrediente.cantidad, ingrediente.unidad)
  const texto = textoRelativoCorto(dias)

  return (
    <li
      ref={ref}
      className={`fila rev ${visible ? 'rev-visible' : ''}`}
      style={{ '--i': posicionEscalonada(indice) } as CSSProperties}
      data-nivel={nivel}
      data-estado={estadoVencimiento(ingrediente.vence, hoy)}
      data-id={ingrediente.id}
      data-nombre={ingrediente.nombre}
    >
      <div className="anim anim-fecha pt-1 text-right leading-none">
        <span className="block text-[11px] font-semibold tracking-wider text-tinta-suave">{fecha.mes}</span>
        <span className="block font-titulo text-[26px] font-extrabold tracking-[-0.03em]">{fecha.dia}</span>
        {fecha.anio && <span className="block text-[10px] font-semibold text-tinta-suave">{fecha.anio}</span>}
      </div>

      <div className="carril">
        <span className="tramo anim anim-tramo" aria-hidden="true" />
        <span className={`nodo anim anim-nodo ${nivel === 'hoy' ? 'nodo-hoy' : ''}`} data-nivel={nivel} aria-hidden="true">
          {vencido && <IconoX className="size-2.5 text-tinta" />}
        </span>
      </div>

      <div>
        <button
          type="button"
          className="banda anim anim-banda"
          data-nivel={nivel}
          aria-haspopup="dialog"
          aria-label={`${nombre}, ${cantidad}, ${texto}. Abrir opciones`}
          onClick={(e) => onAbrir(e.currentTarget)}
        >
          <span className="min-w-0">
            <span
              className={`block font-titulo font-extrabold leading-tight tracking-[-0.03em] break-words ${compacta ? 'text-[18px]' : 'text-[24px]'} ${vencido ? 'line-through' : ''}`}
            >
              {nombre}
            </span>
            <span className="block text-base font-medium">{cantidad}</span>
          </span>
          <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold uppercase tracking-wide ${vencido ? 'text-aviso' : ''}`}>
            <IconoNivel nivel={nivel} className="size-4" />
            {texto}
          </span>
        </button>
      </div>
    </li>
  )
}
