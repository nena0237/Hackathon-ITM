import { useMemo, useState } from 'react'
import { ConfirmarBorrado } from '../components/ConfirmarBorrado'
import { FilaIngrediente } from '../components/FilaIngrediente'
import { FormularioIngrediente } from '../components/FormularioIngrediente'
import { FormularioUso } from '../components/FormularioUso'
import { separarVencidos } from '../domain/despensa'
import { esPorVencer } from '../domain/fechas'
import { cantidadATexto } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import type { AccionesDespensa } from '../hooks/useDespensa'

type Panel = { tipo: 'agregar' } | { tipo: 'editar' | 'usar' | 'borrar'; id: string } | null

interface Props {
  ingredientes: Ingrediente[]
  hoy: Fecha
  acciones: AccionesDespensa
  avisar: (mensaje: string) => void
}

const BOTON = 'min-h-11 rounded-xl bg-white px-3 text-sm font-semibold ring-1 ring-stone-300'

export function Despensa({ ingredientes, hoy, acciones, avisar }: Props) {
  const { vigentes, vencidos } = useMemo(() => separarVencidos(ingredientes, hoy), [ingredientes, hoy])
  const porVencer = vigentes.filter((i) => esPorVencer(i.vence, hoy)).length
  const [panel, setPanel] = useState<Panel>(null)
  const cerrar = () => setPanel(null)

  const formularioAgregar = (
    <FormularioIngrediente
      titulo="Agregar ingrediente"
      textoBoton="Guardar"
      onCancelar={cerrar}
      onGuardar={(entrada) => {
        const r = acciones.agregar(entrada)
        if (!r.ok) return r.errores
        avisar('Ingrediente guardado.')
        cerrar()
        return null
      }}
    />
  )

  const panelDe = (i: Ingrediente) => {
    if (!panel || panel.tipo === 'agregar' || panel.id !== i.id) return undefined
    if (panel.tipo === 'editar')
      return (
        <FormularioIngrediente
          titulo={`Editar ${i.nombre}`}
          textoBoton="Guardar cambios"
          inicial={{ nombre: i.nombre, cantidad: cantidadATexto(i.cantidad), unidad: i.unidad, vence: i.vence }}
          onCancelar={cerrar}
          onGuardar={(entrada) => {
            const r = acciones.editar(i.id, entrada)
            if (!r.ok) return r.errores
            avisar('Cambios guardados.')
            cerrar()
            return null
          }}
        />
      )
    if (panel.tipo === 'usar')
      return (
        <FormularioUso
          ingrediente={i}
          onCancelar={cerrar}
          onUsar={(cantidad) => {
            const r = acciones.usar(i.id, cantidad)
            if (!r.ok) return r.error
            avisar(r.eliminado ? `Usaste todo: ${i.nombre} salió de la despensa.` : 'Cantidad descontada.')
            cerrar()
            return null
          }}
        />
      )
    return (
      <ConfirmarBorrado
        ingrediente={i}
        onCancelar={cerrar}
        onConfirmar={() => {
          acciones.borrar(i.id)
          avisar(`${i.nombre} borrado.`)
          cerrar()
        }}
      />
    )
  }

  const botones = (i: Ingrediente, puedeUsar: boolean) => (
    <>
      {puedeUsar && (
        <button type="button" className={BOTON} aria-label={`Usé ${i.nombre}`} onClick={() => setPanel({ tipo: 'usar', id: i.id })}>
          Usé
        </button>
      )}
      <button type="button" className={BOTON} aria-label={`Editar ${i.nombre}`} onClick={() => setPanel({ tipo: 'editar', id: i.id })}>
        Editar
      </button>
      <button type="button" className={`${BOTON} text-red-800`} aria-label={`Borrar ${i.nombre}`} onClick={() => setPanel({ tipo: 'borrar', id: i.id })}>
        Borrar
      </button>
    </>
  )

  if (ingredientes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border-2 border-dashed border-stone-300 p-6 text-center" data-testid="estado-vacio">
          <p className="text-lg font-semibold">Tu despensa está vacía.</p>
          <p className="text-stone-600">
            Agrega lo que tengas en casa para saber qué usar primero y qué recetas puedes cocinar, o carga datos de ejemplo para probar la app.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" className="min-h-12 rounded-xl bg-emerald-700 px-4 font-semibold text-white" onClick={() => setPanel({ tipo: 'agregar' })}>
              Agregar ingrediente
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl bg-white px-4 font-semibold ring-1 ring-stone-300"
              onClick={() => {
                acciones.cargarEjemplo()
                cerrar()
                avisar('Cargamos los datos de ejemplo con fechas de hoy.')
              }}
            >
              Cargar datos de ejemplo
            </button>
          </div>
        </div>
        {panel?.tipo === 'agregar' && formularioAgregar}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-700" data-testid="resumen">
          {ingredientes.length} {ingredientes.length === 1 ? 'registro' : 'registros'} ·{' '}
          <strong className="text-amber-800">{porVencer} por vencer</strong> ·{' '}
          <strong className="text-red-800">{vencidos.length} {vencidos.length === 1 ? 'vencido' : 'vencidos'}</strong>
        </p>
        <button type="button" className="min-h-11 shrink-0 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white" onClick={() => setPanel({ tipo: 'agregar' })}>
          + Agregar
        </button>
      </div>

      {panel?.tipo === 'agregar' && formularioAgregar}

      <section aria-labelledby="titulo-vigentes">
        <h2 id="titulo-vigentes" className="mb-2 text-lg font-bold">
          En tu despensa ({vigentes.length})
        </h2>
        <p className="mb-2 text-sm text-stone-600">Ordenados por fecha de vencimiento: lo primero es lo que conviene usar antes.</p>
        {vigentes.length > 0 ? (
          <ul className="space-y-2" data-testid="lista-vigentes">
            {vigentes.map((i) => (
              <FilaIngrediente key={i.id} ingrediente={i} hoy={hoy} acciones={botones(i, true)} panel={panelDe(i)} />
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
              <FilaIngrediente key={i.id} ingrediente={i} hoy={hoy} acciones={botones(i, false)} panel={panelDe(i)} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">¡Nada vencido!</p>
        )}
      </section>
    </div>
  )
}
