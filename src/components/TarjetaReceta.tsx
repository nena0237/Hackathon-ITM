import { capitalizar, describirFaltante, describirVencimiento, formatearCantidad } from '../domain/presentacion'
import type { Sugerencia } from '../domain/tipos'

export function TarjetaReceta({ sugerencia }: { sugerencia: Sugerencia }) {
  const { receta, estado, faltantes, aprovecha } = sugerencia
  const cocinable = estado === 'cocinable'
  const pasos = receta.instrucciones.split('\n').filter((p) => p.trim() !== '')

  return (
    <li
      className={`rounded-xl border-2 p-4 ${cocinable ? 'border-green-300 bg-green-50' : 'border-stone-200 bg-white'}`}
      data-receta={receta.nombre}
      data-estado={estado}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold">{receta.nombre}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
            cocinable ? 'border-green-400 bg-green-100 text-green-800' : 'border-stone-300 bg-stone-100 text-stone-700'
          }`}
        >
          {cocinable ? '✓ Puedes cocinarla' : `Faltan ${faltantes.length}`}
        </span>
      </div>

      {aprovecha.length > 0 && (
        <div className="mt-2 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">⏰ Aprovecha lo que está por vencer:</p>
          <ul className="mt-1 list-disc pl-5">
            {aprovecha.map((a) => (
              <li key={a.nombre}>
                {capitalizar(a.nombre)} ({describirVencimiento(a.dias)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {faltantes.length > 0 && (
        <div className="mt-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800">
          <p className="font-semibold">Qué te falta:</p>
          <ul className="mt-1 list-disc pl-5">
            {faltantes.map((f) => (
              <li key={f.nombre} data-motivo={f.motivo}>
                {describirFaltante(f)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer py-1 text-sm font-semibold text-stone-700">Ver ingredientes y preparación</summary>
        <p className="mt-2 text-sm font-semibold">Ingredientes</p>
        <ul className="list-disc pl-5 text-sm">
          {receta.ingredientes.map((i) => (
            <li key={i.nombre}>
              {capitalizar(i.nombre)}: {formatearCantidad(i.cantidad, i.unidad)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-semibold">Preparación</p>
        <ol className="list-decimal pl-5 text-sm">
          {pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </details>
    </li>
  )
}
