import { useMemo } from 'react'
import QRCode from 'qrcode'

interface Props {
  valor: string
  etiqueta: string
  className?: string
}

const MARGEN = 3

/** Genera un código QR en SVG de forma síncrona y sin dependencias de red. */
export function CodigoQr({ valor, etiqueta, className = 'size-56' }: Props) {
  const { total, ruta } = useMemo(() => {
    const qr = QRCode.create(valor, { errorCorrectionLevel: 'M' })
    const n = qr.modules.size
    const partes: string[] = []
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(y, x)) {
          partes.push(`M${x + MARGEN},${y + MARGEN}h1v1h-1z`)
        }
      }
    }
    return { total: n + MARGEN * 2, ruta: partes.join('') }
  }, [valor])

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={etiqueta}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={ruta} fill="#1c1410" />
    </svg>
  )
}

