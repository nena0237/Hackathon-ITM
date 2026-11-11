import { useMemo } from 'react'
import { BloqueReceta } from '../components/BloqueReceta'
import { RECETAS } from '../data/recetas'
import { sugerirRecetas } from '../domain/recetas'
import type { Fecha, Ingrediente } from '../domain/tipos'

export function Recetas({ ingredientes, hoy }: { ingredientes: Ingrediente[]; hoy: Fecha }) {
  const sugerencias = useMemo(() => sugerirRecetas(RECETAS, ingredientes, hoy), [ingredientes, hoy])
  const cocinables = sugerencias.filter((s) => s.estado === 'cocinable')
  const parciales = sugerencias.filter((s) => s.estado === 'parcial')

  return (
    <>
      <header className="pb-4 pt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tinta-suave">Food Saver</p>
        <h1 className="text-[44px] leading-none">Recetas</h1>
        <p className="mt-2 text-base text-tinta-suave">Primero las que aprovechan lo que vence antes.</p>
      </header>

      {ingredientes.length === 0 && (
        <p className="rayado -mx-4 mb-4 px-4 py-4 text-base font-medium">
          Tu despensa está vacía, así que a todas las recetas les falta todo. Agrega ingredientes en Despensa para ver qué puedes cocinar.
        </p>
      )}

      <div className="space-y-6">
        <section aria-labelledby="titulo-cocinables">
          <div className="encabezado-seccion">
            <h2 id="titulo-cocinables" className="text-[26px] leading-tight">
              Puedes cocinar ahora{' '}
              <span className="font-texto text-lg font-semibold tracking-normal text-tinta-suave">{cocinables.length}</span>
            </h2>
          </div>
          {cocinables.length > 0 ? (
            <ul className="space-y-2" data-testid="lista-cocinables">
              {cocinables.map((s, n) => (
                <BloqueReceta key={s.receta.id} sugerencia={s} indice={n} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-base text-tinta-suave">Con lo que tienes vigente todavía no alcanza para una receta completa.</p>
          )}
        </section>

        <section aria-labelledby="titulo-parciales">
          <div className="encabezado-seccion">
            <h2 id="titulo-parciales" className="text-[26px] leading-tight">
              No alcanza{' '}
              <span className="font-texto text-lg font-semibold tracking-normal text-tinta-suave">{parciales.length}</span>
            </h2>
          </div>
          {parciales.length > 0 ? (
            <ul className="space-y-2" data-testid="lista-parciales">
              {parciales.map((s, n) => (
                <BloqueReceta key={s.receta.id} sugerencia={s} indice={n} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-base text-tinta-suave">¡Puedes cocinar todas las recetas!</p>
          )}
        </section>
      </div>
    </>
  )
}
