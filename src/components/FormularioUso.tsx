import { useId, useState, type FormEvent } from 'react'
import { capitalizarNombre } from '../domain/formato'
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
    <form onSubmit={enviar} noValidate aria-label={`Usar ${ingrediente.nombre}`} className="space-y-3">
      <label htmlFor={uid} className="text-base font-semibold">
        ¿Cuánto usaste de {capitalizarNombre(ingrediente.nombre)}? <span className="font-normal text-tinta-suave">(tienes {formatearCantidad(ingrediente.cantidad, ingrediente.unidad)})</span>
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
          className={`min-h-12 w-full rounded-xl border-2 bg-white px-3 text-base text-tinta ${error ? 'border-aviso' : 'border-tinta'}`}
        />
        <span className="flex items-center text-base font-semibold">{ingrediente.unidad}</span>
      </div>
      {error && (
        <p id={`${uid}-error`} role="alert" className="text-sm font-semibold text-aviso">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="min-h-12 flex-1 rounded-2xl bg-tinta px-4 text-base font-semibold text-crema">
          Descontar
        </button>
        <button type="button" onClick={onCancelar} className="min-h-12 rounded-2xl border-2 border-tinta px-5 text-base font-semibold">
          Cancelar
        </button>
      </div>
    </form>
  )
}
