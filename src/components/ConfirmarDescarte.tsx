interface Props {
  onSeguir: () => void
  onDescartar: () => void
}

/** Confirmación en línea (dentro de la hoja, sin window.confirm) al cerrar con cambios sin guardar. */
export function ConfirmarDescarte({ onSeguir, onDescartar }: Props) {
  return (
    <div role="alert" className="mb-4 rounded-2xl bg-mango p-4">
      <p className="text-lg font-semibold">¿Descartar lo escrito?</p>
      <p className="mt-1 text-base">Lo que llenaste no se guardará.</p>
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={onSeguir} className="min-h-12 flex-1 rounded-2xl bg-tinta px-4 text-base font-semibold text-crema">
          Seguir editando
        </button>
        <button type="button" onClick={onDescartar} className="min-h-12 rounded-2xl border-2 border-tinta px-5 text-base font-semibold">
          Descartar
        </button>
      </div>
    </div>
  )
}
