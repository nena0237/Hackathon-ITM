import { separarVencidos } from './despensa'
import { esPorVencer } from './fechas'
import type { Fecha } from './tipos'

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export interface FechaCorta {
  mes: string
  dia: string
  /** Solo si el año es distinto al de `hoy`. */
  anio?: string
}

/** "2026-11-12" → { mes: "NOV", dia: "12" }; agrega `anio` si es distinto al de hoy. */
export function fechaCorta(fecha: Fecha, hoy: Fecha): FechaCorta {
  const [a, m, d] = fecha.split('-')
  const corta: FechaCorta = { mes: MESES[Number(m) - 1], dia: String(Number(d)) }
  if (a !== hoy.split('-')[0]) corta.anio = String(Number(a))
  return corta
}

const plural = (n: number) => (n === 1 ? 'día' : 'días')

/** Días hasta vencer (negativo = ya venció) → "Hoy", "Mañana", "En 2 días", "Hace 1 día", "Hace 5 días". */
export function textoRelativo(dias: number): string {
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `En ${dias} días`
  return `Hace ${-dias} ${plural(-dias)}`
}

/** Versión corta para la banda: "Hoy", "Mañana", "2 días", "Hace 5 días". */
export function textoRelativoCorto(dias: number): string {
  if (dias > 1) return `${dias} días`
  return textoRelativo(dias)
}

/**
 * Nombre para MOSTRAR (no altera lo guardado): espacios limpios y primera letra en mayúscula.
 * Si el nombre venía todo en mayúsculas ("HARINA DE MAÍZ") se pasa a minúsculas antes.
 */
export function capitalizarNombre(nombre: string): string {
  const t = nombre.trim().replace(/\s+/g, ' ')
  const base = t === t.toUpperCase() && t !== t.toLowerCase() ? t.toLowerCase() : t
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export type NivelUrgencia = 'hoy' | 'manana' | 'dos' | 'tres' | 'lejos' | 'muy-lejos' | 'vencido'

/** Tramo de color de la línea de tiempo según los días hasta vencer. */
export function nivelUrgencia(dias: number): NivelUrgencia {
  if (dias < 0) return 'vencido'
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'manana'
  if (dias === 2) return 'dos'
  if (dias === 3) return 'tres'
  return dias > 30 ? 'muy-lejos' : 'lejos'
}

export interface GruposUrgencia<T> {
  /** Vencen en 0 a 3 días. */
  usarPrimero: T[]
  /** Vencen en 4 días o más. */
  conTiempo: T[]
  vencidos: T[]
}

/** Divide la despensa en las 3 secciones de la línea de tiempo, cada una ordenada por vencimiento. */
export function agruparPorUrgencia<T extends { nombre: string; vence: Fecha }>(lista: readonly T[], hoy: Fecha): GruposUrgencia<T> {
  const { vigentes, vencidos } = separarVencidos(lista, hoy)
  return {
    usarPrimero: vigentes.filter((i) => esPorVencer(i.vence, hoy)),
    conTiempo: vigentes.filter((i) => !esPorVencer(i.vence, hoy)),
    vencidos,
  }
}

/** Solo los primeros 8 elementos de una lista entran escalonados; del 9.º en adelante no esperan (retraso 0). */
export const MAX_ESCALONADOS = 8

export function posicionEscalonada(indice: number): number {
  return indice >= 0 && indice < MAX_ESCALONADOS ? indice : 0
}
