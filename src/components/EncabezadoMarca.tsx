import { IconoQr } from './Iconos'

interface Props {
  onAbrirQr?: (abridor: HTMLElement) => void
}

/** Fila superior de marca con acceso opcional al QR de descarga de la app Android. */
export function EncabezadoMarca({ onAbrirQr }: Props) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tinta-suave">Food Saver</p>
      {onAbrirQr && (
        <button
          type="button"
          onClick={(e) => onAbrirQr(e.currentTarget)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-tinta bg-crema px-3 text-sm font-semibold text-tinta transition-colors hover:bg-mango-claro"
          aria-label="Ver código QR para descargar el APK de Android"
        >
          <IconoQr className="size-4 shrink-0" />
          App Android · QR
        </button>
      )}
    </div>
  )
}

