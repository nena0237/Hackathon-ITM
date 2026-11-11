import type { NivelUrgencia } from '../domain/formato'

interface P {
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  focusable: false as const,
}

export const IconoMas = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconoX = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconoAlerta = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.2v.1" />
  </svg>
)
export const IconoReloj = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const IconoHoja = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15" />
    <path d="M5 19c3-5 6-8 10-10" />
  </svg>
)
export const IconoDespensa = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M7 4h10M8 4v3M16 4v3M6 7h12v13H6z" />
    <path d="M6 12h12" />
  </svg>
)
export const IconoRecetas = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M4 11h16v3a6 6 0 01-6 6h-4a6 6 0 01-6-6z" />
    <path d="M9 4c0 1.5 1 1.5 1 3M14 4c0 1.5 1 1.5 1 3" />
  </svg>
)
export const IconoEditar = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
)
export const IconoBorrar = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
  </svg>
)
export const IconoUsar = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const IconoFaltan = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" />
  </svg>
)
export const IconoQr = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
    <path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
  </svg>
)
export const IconoDescarga = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
)

/** Ícono del estado por urgencia (el color nunca va solo). */
export function IconoNivel({ nivel, className }: { nivel: NivelUrgencia; className?: string }) {
  if (nivel === 'hoy') return <IconoAlerta className={className} />
  if (nivel === 'vencido') return <IconoX className={className} />
  if (nivel === 'lejos' || nivel === 'muy-lejos') return <IconoHoja className={className} />
  return <IconoReloj className={className} />
}
