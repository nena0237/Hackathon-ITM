import { useId, useRef, useState, type FormEvent } from 'react'
import { UNIDADES, type ErroresFormulario, type IngredienteEntrada } from '../domain/tipos'

interface Props {
  titulo: string
  textoBoton: string
  inicial?: { nombre: string; cantidad: string; unidad: string; vence: string }
  /** Devuelve null si se guardó, o los errores por campo. */
  onGuardar: (entrada: IngredienteEntrada) => ErroresFormulario | null
  onCancelar: () => void
}

type Campo = 'nombre' | 'cantidad' | 'unidad' | 'vence'

export function FormularioIngrediente({ titulo, textoBoton, inicial, onGuardar, onCancelar }: Props) {
  const uid = useId()
  const [valores, setValores] = useState(inicial ?? { nombre: '', cantidad: '', unidad: 'unidad', vence: '' })
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const refs = useRef<Partial<Record<Campo, HTMLInputElement | HTMLSelectElement | null>>>({})

  const id = (c: Campo) => `${uid}-${c}`
  const cambiar = (c: Campo, v: string) => setValores((x) => ({ ...x, [c]: v }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const res = onGuardar(valores)
    if (res === null) return
    setErrores(res)
    const primero = (['nombre', 'cantidad', 'unidad', 'vence'] as const).find((c) => res[c])
    if (primero) refs.current[primero]?.focus()
  }

  const base = 'mt-1 block min-h-11 w-full rounded-lg border-2 bg-white px-3 text-base'
  const clase = (c: Campo) => `${base} ${errores[c] ? 'border-red-500' : 'border-stone-300'}`
  const Error = ({ c }: { c: Campo }) =>
    errores[c] ? (
      <p id={`${id(c)}-error`} role="alert" className="mt-1 text-sm font-medium text-red-700">
        {errores[c]}
      </p>
    ) : null
  const aria = (c: Campo) => ({
    'aria-invalid': errores[c] ? (true as const) : undefined,
    'aria-describedby': errores[c] ? `${id(c)}-error` : undefined,
  })

  return (
    <form onSubmit={enviar} noValidate aria-label={titulo} className="space-y-3 rounded-xl border-2 border-emerald-300 bg-white p-4">
      <h3 className="text-lg font-bold">{titulo}</h3>
      {errores.general && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {errores.general}
        </p>
      )}

      <div>
        <label htmlFor={id('nombre')} className="font-semibold">
          Nombre
        </label>
        <input
          id={id('nombre')}
          ref={(el) => { refs.current.nombre = el }}
          type="text"
          autoComplete="off"
          value={valores.nombre}
          onChange={(e) => cambiar('nombre', e.target.value)}
          className={clase('nombre')}
          {...aria('nombre')}
        />
        <Error c="nombre" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor={id('cantidad')} className="font-semibold">
            Cantidad
          </label>
          <input
            id={id('cantidad')}
            ref={(el) => { refs.current.cantidad = el }}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={valores.cantidad}
            onChange={(e) => cambiar('cantidad', e.target.value)}
            className={clase('cantidad')}
            {...aria('cantidad')}
          />
          <Error c="cantidad" />
        </div>
        <div className="w-32">
          <label htmlFor={id('unidad')} className="font-semibold">
            Unidad
          </label>
          <select
            id={id('unidad')}
            ref={(el) => { refs.current.unidad = el }}
            value={valores.unidad}
            onChange={(e) => cambiar('unidad', e.target.value)}
            className={clase('unidad')}
            {...aria('unidad')}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Error c="unidad" />
        </div>
      </div>

      <div>
        <label htmlFor={id('vence')} className="font-semibold">
          Fecha de vencimiento
        </label>
        <input
          id={id('vence')}
          ref={(el) => { refs.current.vence = el }}
          type="date"
          value={valores.vence}
          onChange={(e) => cambiar('vence', e.target.value)}
          className={clase('vence')}
          {...aria('vence')}
        />
        <Error c="vence" />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="min-h-12 flex-1 rounded-xl bg-emerald-700 px-4 font-semibold text-white">
          {textoBoton}
        </button>
        <button type="button" onClick={onCancelar} className="min-h-12 rounded-xl bg-white px-4 font-semibold ring-1 ring-stone-300">
          Cancelar
        </button>
      </div>
    </form>
  )
}
