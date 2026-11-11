import type { CSSProperties } from 'react'
import { capitalizarNombre, nivelUrgencia, posicionEscalonada, textoRelativo } from '../domain/formato'
import { describirFaltante, formatearCantidad } from '../domain/presentacion'
import type { Sugerencia } from '../domain/tipos'
import { useRevealUnaVez } from '../hooks/useReveal'
import { IconoFaltan, IconoUsar } from './Iconos'

/** Línea de tiempo en pequeño con los ingredientes por vencer que aprovecha la receta. */
function MiniLinea({ aprovecha }: { aprovecha: Sugerencia['aprovecha'] }) {
  return (
    <ol className="mt-1" aria-label="Ingredientes por vencer que aprovecha">
      {aprovecha.map((a, i) => (
        <li key={a.nombre} className="relative flex items-center gap-3 py-1 pl-6 text-base font-semibold" data-nivel={nivelUrgencia(a.dias)}>
          {i < aprovecha.length - 1 && <span className="absolute left-[7px] top-1/2 h-full w-[3px] bg-tinta/40" aria-hidden="true" />}
          <span className="absolute left-0 top-1/2 z-10 size-4 -translate-y-1/2 rounded-full border-2 border-tinta bg-[var(--tono)]" aria-hidden="true" />
          <span>
            {capitalizarNombre(a.nombre)} <span className="font-medium">· {textoRelativo(a.dias)}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Un bloque a todo ancho por receta: lima si se puede cocinar, gris rayado si no alcanza. */
export function BloqueReceta({ sugerencia, indice }: { sugerencia: Sugerencia; indice: number }) {
  const { receta, estado, faltantes, aprovecha } = sugerencia
  const cocinable = estado === 'cocinable'
  const pasos = receta.instrucciones.split('\n').filter((p) => p.trim() !== '')
  const { ref, visible } = useRevealUnaVez<HTMLLIElement>()

  return (
    <li
      ref={ref}
      className={`rev -mx-4 px-4 py-5 text-tinta ${cocinable ? 'bg-lima' : 'rayado'} ${visible ? 'rev-visible' : ''}`}
      style={{ '--i': posicionEscalonada(indice) } as CSSProperties}
      data-receta={receta.nombre}
      data-estado={estado}
    >
      <div className="anim anim-banda">
        <h3 className="text-[28px] leading-none">{receta.nombre}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide">
          {cocinable ? <IconoUsar className="size-4" /> : <IconoFaltan className="size-4" />}
          {cocinable ? 'Puedes cocinarla' : `No alcanza · te ${faltantes.length === 1 ? 'falta 1' : `faltan ${faltantes.length}`}`}
        </p>

        {aprovecha.length > 0 && (
          <div className="mt-4">
            <h4 className="font-titulo text-lg font-extrabold tracking-[-0.03em]">Aprovecha lo que vence</h4>
            <MiniLinea aprovecha={aprovecha} />
          </div>
        )}

        {faltantes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-titulo text-lg font-extrabold tracking-[-0.03em]">Qué te falta</h4>
            <ul className="mt-1 space-y-1.5">
              {faltantes.map((f) => (
                <li key={f.nombre} data-motivo={f.motivo} className="text-base font-medium">
                  {describirFaltante(f)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="mt-4">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4">Ver ingredientes y preparación</summary>
          <h4 className="mt-2 font-titulo text-lg font-extrabold tracking-[-0.03em]">Ingredientes</h4>
          <ul className="list-disc pl-5 text-base">
            {receta.ingredientes.map((i) => (
              <li key={i.nombre}>
                {capitalizarNombre(i.nombre)}: {formatearCantidad(i.cantidad, i.unidad)}
              </li>
            ))}
          </ul>
          <h4 className="mt-3 font-titulo text-lg font-extrabold tracking-[-0.03em]">Preparación</h4>
          <ol className="list-decimal pl-5 text-base">
            {pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </details>
      </div>
    </li>
  )
}
