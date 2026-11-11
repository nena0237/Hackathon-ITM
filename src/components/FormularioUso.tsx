import { useId, useState, type FormEvent } from 'react'
import { formatearCantidad } from '../domain/presentacion'
import type { Ingrediente } from '../domain/tipos'

interface Props {
  ingrediente: Ingrediente
  /** Devuelve null si se descontó, o el mensaje de error. */
  onUsar: (cantidad: string) => string | null
  onCancelar: () => void
}

export function FormularioUso({ ingrediente, onUsar, onCancelar }: Props) {
  const uid = useId()
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setError(onUsar(valor))
  }

  return (
    <form onSubmit={enviar} noValidate aria-label={`Usar ${ingrediente.nombre}`} className="space-y-2 rounded-xl border-2 border-emerald-300 bg-white p-3">
      <label htmlFor={uid} className="font-semibold">
        ¿Cuánto usaste de {ingrediente.nombre}? <span className="font-normal text-stone-600">(tienes {formatearCantidad(ingrediente.cantidad, ingrediente.unidad)})</span>
      </label>
      <div className="flex gap-2">
        <input
          id={uid}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          className={`min-h-11 w-full rounded-lg border-2 bg-white px-3 text-base ${error ? 'border-red-500' : 'border-stone-300'}`}
        />
        <span className="flex items-center text-stone-700">{ingrediente.unidad}</span>
      </div>
      {error && (
        <p id={`${uid}-error`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="min-h-11 flex-1 rounded-xl bg-emerald-700 px-4 font-semibold text-white">
          Descontar
        </button>
        <button type="button" onClick={onCancelar} className="min-h-11 rounded-xl bg-white px-4 font-semibold ring-1 ring-stone-300">
          Cancelar
        </button>
      </div>
    </form>
  )
}
