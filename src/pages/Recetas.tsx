import { useMemo } from 'react'
import { TarjetaReceta } from '../components/TarjetaReceta'
import { RECETAS } from '../data/recetas'
import { sugerirRecetas } from '../domain/recetas'
import type { Fecha, Ingrediente } from '../domain/tipos'

export function Recetas({ ingredientes, hoy }: { ingredientes: Ingrediente[]; hoy: Fecha }) {
  const sugerencias = useMemo(() => sugerirRecetas(RECETAS, ingredientes, hoy), [ingredientes, hoy])
  const cocinables = sugerencias.filter((s) => s.estado === 'cocinable')
  const parciales = sugerencias.filter((s) => s.estado === 'parcial')

  return (
    <div className="space-y-6">
      {ingredientes.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-stone-300 p-4 text-center text-stone-600">
          Tu despensa está vacía, así que a todas las recetas les falta todo. Agrega ingredientes para ver qué puedes cocinar.
        </p>
      )}

      <section aria-labelledby="titulo-cocinables">
        <h2 id="titulo-cocinables" className="mb-2 text-lg font-bold">
          Puedes cocinar ahora ({cocinables.length})
        </h2>
        {cocinables.length > 0 ? (
          <ul className="space-y-3" data-testid="lista-cocinables">
            {cocinables.map((s) => (
              <TarjetaReceta key={s.receta.id} sugerencia={s} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">Con lo que tienes vigente todavía no alcanza para una receta completa.</p>
        )}
      </section>

      <section aria-labelledby="titulo-parciales">
        <h2 id="titulo-parciales" className="mb-2 text-lg font-bold">
          Te faltan ingredientes ({parciales.length})
        </h2>
        {parciales.length > 0 ? (
          <ul className="space-y-3" data-testid="lista-parciales">
            {parciales.map((s) => (
              <TarjetaReceta key={s.receta.id} sugerencia={s} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">¡Puedes cocinar todas las recetas!</p>
        )}
      </section>
    </div>
  )
}
