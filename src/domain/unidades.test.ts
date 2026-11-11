import { describe, expect, it } from 'vitest'
import { convertirUnidad } from './unidades'

describe('grupo 5: conversión de unidades', () => {
  it('g ↔ kg', () => {
    expect(convertirUnidad(500, 'g', 'kg')).toBe(0.5)
    expect(convertirUnidad(1, 'kg', 'g')).toBe(1000)
    expect(convertirUnidad(250, 'g', 'kg')).toBe(0.25)
  })

  it('ml ↔ l', () => {
    expect(convertirUnidad(250, 'ml', 'l')).toBe(0.25)
    expect(convertirUnidad(2, 'l', 'ml')).toBe(2000)
  })

  it('misma unidad no cambia la cantidad', () => {
    expect(convertirUnidad(3, 'unidad', 'unidad')).toBe(3)
    expect(convertirUnidad(7.5, 'g', 'g')).toBe(7.5)
  })

  it('sin ruido de punto flotante (1.1 kg = 1100 g exactos)', () => {
    expect(convertirUnidad(1.1, 'kg', 'g')).toBe(1100)
    expect(convertirUnidad(0.3, 'l', 'ml')).toBe(300)
  })

  it('unidades incompatibles devuelven null (nunca un número inventado)', () => {
    expect(convertirUnidad(500, 'g', 'ml')).toBeNull()
    expect(convertirUnidad(1, 'l', 'kg')).toBeNull()
    expect(convertirUnidad(500, 'g', 'unidad')).toBeNull()
    expect(convertirUnidad(2, 'unidad', 'kg')).toBeNull()
    expect(convertirUnidad(2, 'unidad', 'l')).toBeNull()
    expect(convertirUnidad(2, 'ml', 'g')).toBeNull()
  })
})
