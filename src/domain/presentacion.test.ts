import { describe, expect, it } from 'vitest'
import { estadoVencimiento, sumarDias } from './fechas'
import { describirFaltante, describirVencimiento, formatearCantidad, formatearNumero } from './presentacion'
import { en, HOY } from './pruebas-util'
import type { Faltante } from './tipos'

describe('sumarDias (para el seed relativo a hoy)', () => {
  it('coincide con un cálculo independiente (Date.UTC) en ±800 días, cruzando bisiestos', () => {
    for (let n = -800; n <= 800; n++) expect(sumarDias(HOY, n)).toBe(en(n))
  })

  it('casos de borde conocidos', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(sumarDias('2028-02-28', 2)).toBe('2028-03-01')
    expect(sumarDias('2027-02-28', 1)).toBe('2027-03-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    expect(sumarDias('2026-03-15', 0)).toBe('2026-03-15')
    expect(sumarDias('2026-03-15', 180)).toBe('2026-09-11')
  })

  it('lanza error con una fecha inválida', () => {
    expect(() => sumarDias('2026-02-31', 1)).toThrow(RangeError)
  })
})

describe('estadoVencimiento', () => {
  it('vencido / por vencer / vigente según los días', () => {
    const e = (n: number) => estadoVencimiento(en(n), HOY)
    expect([e(-5), e(-1), e(0), e(1), e(3), e(4), e(180)]).toEqual([
      'vencido', 'vencido', 'por-vencer', 'por-vencer', 'por-vencer', 'vigente', 'vigente',
    ])
  })
})

describe('textos para la interfaz', () => {
  it('formatearNumero: coma decimal y sin ceros sobrantes', () => {
    expect(formatearNumero(2.5)).toBe('2,5')
    expect(formatearNumero(250)).toBe('250')
    expect(formatearNumero(0.0001)).toBe('0,0001')
    expect(formatearNumero(0.1 + 0.2)).toBe('0,3')
  })

  it('formatearCantidad: singular y plural de unidad', () => {
    expect(formatearCantidad(1, 'unidad')).toBe('1 unidad')
    expect(formatearCantidad(4, 'unidad')).toBe('4 unidades')
    expect(formatearCantidad(0.5, 'kg')).toBe('0,5 kg')
    expect(formatearCantidad(1, 'l')).toBe('1 l')
  })

  it('describirVencimiento cubre vencido, hoy, mañana y futuro', () => {
    expect(describirVencimiento(-5)).toBe('venció hace 5 días')
    expect(describirVencimiento(-1)).toBe('venció ayer')
    expect(describirVencimiento(0)).toBe('vence hoy')
    expect(describirVencimiento(1)).toBe('vence mañana')
    expect(describirVencimiento(2)).toBe('vence en 2 días')
    expect(describirVencimiento(180)).toBe('vence en 180 días')
  })

  it('describirFaltante da un mensaje distinto y claro por cada motivo', () => {
    const base = { nombre: 'leche', unidad: 'l', necesita: 1, disponible: 0, falta: 1 } as const
    const f = (motivo: Faltante['motivo'], extra: Partial<Faltante> = {}): Faltante => ({ ...base, motivo, ...extra })
    expect(describirFaltante(f('no-hay'))).toBe('Te falta leche: necesitas 1 l y no tienes.')
    expect(describirFaltante(f('vencido'))).toBe(
      'Lo que tienes de leche está vencido: necesitas 1 l y no puedes usar lotes vencidos.',
    )
    // sin concordancia de género que pueda salir mal con otros nombres
    expect(describirFaltante(f('vencido', { nombre: 'queso' }))).toMatch(/Lo que tienes de queso está vencido/)
    expect(describirFaltante(f('insuficiente', { necesita: 1, disponible: 0.5, falta: 0.5, unidad: 'kg', nombre: 'harina' }))).toBe(
      'Te falta harina: necesitas 1 kg, tienes 0,5 kg; faltan 0,5 kg.',
    )
    expect(describirFaltante(f('unidad-incompatible', { necesita: 2, unidad: 'unidad', nombre: 'harina' }))).toBe(
      'Te falta harina: necesitas 2 unidades, pero lo tienes en una unidad que no se puede convertir.',
    )
  })
})

describe('formatearFecha', () => {
  it('AAAA-MM-DD → DD/MM/AAAA', async () => {
    const { formatearFecha } = await import('./presentacion')
    expect(formatearFecha('2026-03-05')).toBe('05/03/2026')
    expect(formatearFecha('2036-12-31')).toBe('31/12/2036')
  })
})

describe('capitalizar', () => {
  it('solo la primera letra (no cada palabra)', async () => {
    const { capitalizar } = await import('./presentacion')
    expect(capitalizar('harina de maíz')).toBe('Harina de maíz')
    expect(capitalizar('ñame')).toBe('Ñame')
    expect(capitalizar('')).toBe('')
    expect(capitalizar('Tomate')).toBe('Tomate')
  })
})
