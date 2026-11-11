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

/** Cantidad como texto editable en un campo: 2.5 → "2,5", sin perder decimales ni usar notación científica. */
export function cantidadATexto(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 20, useGrouping: false }).replace('.', ',')
}
