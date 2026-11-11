import type { EstadoVencimiento } from '../domain/fechas'

const ESTILOS: Record<EstadoVencimiento, { clases: string; icono: string; texto: string }> = {
  vencido: { clases: 'bg-red-100 text-red-800 border-red-300', icono: '⛔', texto: 'Vencido' },
  'por-vencer': { clases: 'bg-amber-100 text-amber-900 border-amber-400', icono: '⏰', texto: 'Por vencer' },
  vigente: { clases: 'bg-green-100 text-green-800 border-green-300', icono: '✓', texto: 'Vigente' },
}

/** Etiqueta de urgencia: color + ícono + texto (el color nunca va solo). */
export function Insignia({ estado }: { estado: EstadoVencimiento }) {
  const e = ESTILOS[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${e.clases}`}>
      <span aria-hidden="true">{e.icono}</span>
      {e.texto}
    </span>
  )
}
