import type { Faltante, Unidad } from './tipos'

/** 2.5 → "2,5"; 0.0001 → "0,0001"; sin ceros sobrantes ni ruido de flotantes. */
export function formatearNumero(n: number): string {
  const r = Math.round(n * 10000) / 10000
  return String(r).replace('.', ',')
}

/** "1 unidad", "4 unidades", "250 g", "0,5 kg". */
export function formatearCantidad(cantidad: number, unidad: Unidad): string {
  if (unidad === 'unidad') return `${formatearNumero(cantidad)} ${cantidad === 1 ? 'unidad' : 'unidades'}`
  return `${formatearNumero(cantidad)} ${unidad}`
}

/** Texto del vencimiento a partir de los días que faltan (negativo = ya venció). */
export function describirVencimiento(dias: number): string {
  if (dias < -1) return `venció hace ${-dias} días`
  if (dias === -1) return 'venció ayer'
  if (dias === 0) return 'vence hoy'
  if (dias === 1) return 'vence mañana'
  return `vence en ${dias} días`
}

/** Mensaje en español de por qué falta un ingrediente de una receta. */
export function describirFaltante(f: Faltante): string {
  const necesita = formatearCantidad(f.necesita, f.unidad)
  switch (f.motivo) {
    case 'no-hay':
      return `Te falta ${f.nombre}: necesitas ${necesita} y no tienes.`
    case 'insuficiente':
      return `Te falta ${f.nombre}: necesitas ${necesita}, tienes ${formatearCantidad(f.disponible, f.unidad)}; faltan ${formatearCantidad(f.falta, f.unidad)}.`
    case 'vencido':
      return `Lo que tienes de ${f.nombre} está vencido: necesitas ${necesita} y no puedes usar lotes vencidos.`
    case 'unidad-incompatible':
      return `Te falta ${f.nombre}: necesitas ${necesita}, pero lo tienes en una unidad que no se puede convertir.`
  }
}

/** "2026-03-15" → "15/03/2026". */
export function formatearFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-')
  return `${d}/${m}/${a}`
}

/** Solo la primera letra en mayúscula: "harina de maíz" → "Harina de maíz". */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Cantidad como texto editable en un campo: 2.5 → "2,5", sin perder decimales ni usar notación científica. */
export function cantidadATexto(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 20, useGrouping: false }).replace('.', ',')
}
