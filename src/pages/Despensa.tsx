import { useMemo } from 'react'
import { FilaIngrediente } from '../components/FilaIngrediente'
import { separarVencidos } from '../domain/despensa'
import { esPorVencer } from '../domain/fechas'
import type { Fecha, Ingrediente } from '../domain/tipos'

export function Despensa({ ingredientes, hoy }: { ingredientes: Ingrediente[]; hoy: Fecha }) {
  const { vigentes, vencidos } = useMemo(() => separarVencidos(ingredientes, hoy), [ingredientes, hoy])
  const porVencer = vigentes.filter((i) => esPorVencer(i.vence, hoy)).length

  if (ingredientes.length === 0) {
    return <p className="rounded-xl border-2 border-dashed border-stone-300 p-6 text-center text-stone-600">Tu despensa está vacía.</p>
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-700" data-testid="resumen">
        {ingredientes.length} {ingredientes.length === 1 ? 'registro' : 'registros'} ·{' '}
        <strong className="text-amber-800">{porVencer} por vencer</strong> ·{' '}
        <strong className="text-red-800">{vencidos.length} {vencidos.length === 1 ? 'vencido' : 'vencidos'}</strong>
      </p>

      <section aria-labelledby="titulo-vigentes">
        <h2 id="titulo-vigentes" className="mb-2 text-lg font-bold">
          En tu despensa ({vigentes.length})
        </h2>
        <p className="mb-2 text-sm text-stone-600">Ordenados por fecha de vencimiento: lo primero es lo que conviene usar antes.</p>
        {vigentes.length > 0 ? (
          <ul className="space-y-2" data-testid="lista-vigentes">
            {vigentes.map((i) => (
              <FilaIngrediente key={i.id} ingrediente={i} hoy={hoy} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">No tienes ingredientes vigentes.</p>
        )}
      </section>

      <section aria-labelledby="titulo-vencidos" className="rounded-xl border-2 border-red-200 bg-red-50/40 p-3">
        <h2 id="titulo-vencidos" className="mb-1 text-lg font-bold text-red-900">
          Vencidos ({vencidos.length})
        </h2>
        <p className="mb-2 text-sm text-red-900">No se usan en las sugerencias de recetas. Revísalos antes de cocinar.</p>
        {vencidos.length > 0 ? (
          <ul className="space-y-2" data-testid="lista-vencidos">
            {vencidos.map((i) => (
              <FilaIngrediente key={i.id} ingrediente={i} hoy={hoy} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">¡Nada vencido!</p>
        )}
      </section>
    </div>
  )
}
