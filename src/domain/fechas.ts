import type { Fecha } from './tipos'

/** "Por vencer" = vence en 0 a 3 días. */
export const DIAS_POR_VENCER = 3

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/

function bisiesto(a: number): boolean {
  return (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0
}

function diasDelMes(a: number, m: number): number {
  return [31, bisiesto(a) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

/** True solo para un YYYY-MM-DD real del calendario (rechaza 2026-02-31). */
export function esFechaValida(f: unknown): f is Fecha {
  if (typeof f !== 'string') return false
  const m = FORMATO.exec(f)
  if (!m) return false
  const a = Number(m[1])
  const mes = Number(m[2])
  const d = Number(m[3])
  return a >= 1 && mes >= 1 && mes <= 12 && d >= 1 && d <= diasDelMes(a, mes)
}

/** Número de día absoluto (calendario gregoriano). Sin Date ni zonas horarias. */
function numeroDeDia(f: Fecha): number {
  if (!esFechaValida(f)) throw new RangeError(`Fecha inválida: ${String(f)}`)
  const [a, m, d] = f.split('-').map(Number)
  const y = m <= 2 ? a - 1 : a
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe
}

/** Días desde `hoy` hasta `vence`: negativo = ya venció, 0 = vence hoy. */
export function diasParaVencer(vence: Fecha, hoy: Fecha): number {
  return numeroDeDia(vence) - numeroDeDia(hoy)
}

/** Vencido = fecha < hoy. Vence hoy NO es vencido. */
export function esVencido(vence: Fecha, hoy: Fecha): boolean {
  return diasParaVencer(vence, hoy) < 0
}

/** Por vencer = vence en 0 a 3 días (incluye hoy). */
export function esPorVencer(vence: Fecha, hoy: Fecha): boolean {
  const d = diasParaVencer(vence, hoy)
  return d >= 0 && d <= DIAS_POR_VENCER
}

/** Convierte un Date a YYYY-MM-DD en hora LOCAL (la UI lo usa para obtener `hoy`). */
export function fechaLocalISO(date: Date): Fecha {
  const p = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${p(date.getFullYear(), 4)}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}
