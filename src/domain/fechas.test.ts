import { describe, expect, it } from 'vitest'
import { diasParaVencer, esFechaValida, esPorVencer, esVencido, fechaLocalISO } from './fechas'
import { HOY, en } from './pruebas-util'

describe('fechas: vencido, por vencer y días (grupo 3 y grupo 9)', () => {
  it('grupo 3: ayer está vencido, hoy NO, mañana NO', () => {
    expect(esVencido(en(-1), HOY)).toBe(true)
    expect(esVencido(HOY, HOY)).toBe(false)
    expect(esVencido(en(1), HOY)).toBe(false)
  })

  it('diasParaVencer devuelve el número exacto con signo', () => {
    expect(diasParaVencer(HOY, HOY)).toBe(0)
    expect(diasParaVencer(en(1), HOY)).toBe(1)
    expect(diasParaVencer(en(-5), HOY)).toBe(-5)
    expect(diasParaVencer(en(180), HOY)).toBe(180)
  })

  it('grupo 3: dentro de 10 años es válida y no vencida (3650 + 3 bisiestos: 2028, 2032, 2036)', () => {
    expect(esFechaValida('2036-03-15')).toBe(true)
    expect(diasParaVencer('2036-03-15', HOY)).toBe(3653)
    expect(esVencido('2036-03-15', HOY)).toBe(false)
  })

  it('"por vencer" es 0 a 3 días: el 3 entra, el 4 no, vencido no', () => {
    expect(esPorVencer(HOY, HOY)).toBe(true)
    expect(esPorVencer(en(3), HOY)).toBe(true)
    expect(esPorVencer(en(4), HOY)).toBe(false)
    expect(esPorVencer(en(-1), HOY)).toBe(false)
  })

  it('cruza fin de mes, fin de año y años bisiestos correctamente', () => {
    expect(diasParaVencer('2027-01-01', '2026-12-31')).toBe(1)
    expect(diasParaVencer('2028-03-01', '2028-02-28')).toBe(2) // 2028 es bisiesto
    expect(diasParaVencer('2027-03-01', '2027-02-28')).toBe(1)
  })

  it('grupo 9: el mismo dato pasa de por vencer a vencido al cambiar hoy', () => {
    const vence = '2026-03-17'
    const estados = ['2026-03-14', '2026-03-15', '2026-03-17', '2026-03-18'].map((h) => ({
      dias: diasParaVencer(vence, h),
      porVencer: esPorVencer(vence, h),
      vencido: esVencido(vence, h),
    }))
    expect(estados).toEqual([
      { dias: 3, porVencer: true, vencido: false },
      { dias: 2, porVencer: true, vencido: false },
      { dias: 0, porVencer: true, vencido: false },
      { dias: -1, porVencer: false, vencido: true },
    ])
  })

  it('lanza error ante una fecha inválida en vez de dar un número silencioso', () => {
    expect(() => diasParaVencer('2026-02-31', HOY)).toThrow(RangeError)
    expect(() => esVencido('basura', HOY)).toThrow(RangeError)
  })
})

describe('esFechaValida (grupo 3)', () => {
  it.each(['2026-03-15', '2028-02-29', '2000-02-29', '2036-03-15', '2026-12-31'])('acepta %s', (f) => {
    expect(esFechaValida(f)).toBe(true)
  })

  it.each([
    '',
    '   ',
    'mañana',
    '15/03/2026',
    '2026-3-5',
    '20260315',
    '2026-03-15T10:00',
    ' 2026-03-15',
    '2026-02-31',
    '2026-04-31',
    '2026-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-01-00',
    '0000-01-01',
  ])('rechaza "%s"', (f) => {
    expect(esFechaValida(f)).toBe(false)
  })

  it('rechaza valores que no son texto', () => {
    expect(esFechaValida(undefined)).toBe(false)
    expect(esFechaValida(null)).toBe(false)
    expect(esFechaValida(20260315)).toBe(false)
    expect(esFechaValida(new Date())).toBe(false)
  })
})

describe('fechaLocalISO', () => {
  it('usa la hora local, con ceros a la izquierda', () => {
    expect(fechaLocalISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(fechaLocalISO(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })
})
