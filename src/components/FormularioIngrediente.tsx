import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { UNIDADES, type ErroresFormulario, type IngredienteEntrada } from '../domain/tipos'

interface Props {
  titulo: string
  textoBoton: string
  inicial?: { nombre: string; cantidad: string; unidad: string; vence: string }
  /** Devuelve null si se guardó, o los errores por campo. */
  onGuardar: (entrada: IngredienteEntrada) => ErroresFormulario | null
  onCancelar: () => void
  /** Avisa si hay cambios sin guardar (para pedir confirmación al cerrar la hoja). */
  onCambios?: (sucio: boolean) => void
}

type Campo = 'nombre' | 'cantidad' | 'unidad' | 'vence'

export function FormularioIngrediente({ titulo, textoBoton, inicial, onGuardar, onCancelar, onCambios }: Props) {
  const uid = useId()
  const [valoresIniciales] = useState(() => inicial ?? { nombre: '', cantidad: '', unidad: 'unidad', vence: '' })
  const [valores, setValores] = useState(valoresIniciales)
  const sucio = (Object.keys(valoresIniciales) as Campo[]).some((c) => valores[c] !== valoresIniciales[c])
  useEffect(() => onCambios?.(sucio), [sucio]) // eslint-disable-line react-hooks/exhaustive-deps
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

  const base = 'mt-1 block min-h-12 w-full rounded-xl border-2 bg-white px-3 text-base text-tinta'
  const clase = (c: Campo) => `${base} ${errores[c] ? 'border-aviso' : 'border-tinta'}`
  const Error = ({ c }: { c: Campo }) =>
    errores[c] ? (
      <p id={`${id(c)}-error`} role="alert" className="mt-1 text-sm font-semibold text-aviso">
        {errores[c]}
      </p>
    ) : null
  const aria = (c: Campo) => ({
    'aria-invalid': errores[c] ? (true as const) : undefined,
    'aria-describedby': errores[c] ? `${id(c)}-error` : undefined,
  })

  return (
    <form onSubmit={enviar} noValidate aria-label={titulo} className="space-y-4">
      {errores.general && (
        <p role="alert" className="text-sm font-semibold text-aviso">
          {errores.general}
        </p>
      )}

      <div>
        <label htmlFor={id('nombre')} className="text-base font-semibold">
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
          <label htmlFor={id('cantidad')} className="text-base font-semibold">
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
          <label htmlFor={id('unidad')} className="text-base font-semibold">
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
        <label htmlFor={id('vence')} className="text-base font-semibold">
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
        <button type="submit" className="min-h-12 flex-1 rounded-2xl bg-tinta px-4 text-base font-semibold text-crema">
          {textoBoton}
        </button>
        <button type="button" onClick={onCancelar} className="min-h-12 rounded-2xl border-2 border-tinta px-5 text-base font-semibold">
          Cancelar
        </button>
      </div>
    </form>
  )
}
