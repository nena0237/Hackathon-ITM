import { describe, expect, it } from 'vitest'
import type { Ingrediente } from '../domain/tipos'
import { serializarDespensa } from '../domain/persistencia'
import { CLAVE } from './almacen'
import { escucharCambiosExternos } from './sincronizar'

const lote = (id: string, nombre: string): Ingrediente => ({ id, nombre, cantidad: 1, unidad: 'unidad', vence: '2026-04-01' })

/** Simula el evento `storage` que el navegador dispara en las OTRAS pestañas. */
const disparar = (destino: EventTarget, key: string | null, newValue: string | null) =>
  destino.dispatchEvent(Object.assign(new Event('storage'), { key, newValue }))

describe('AC-3: sincronización entre pestañas (evento storage)', () => {
  it('cuando otra pestaña guarda, entrega la lista nueva', () => {
    const destino = new EventTarget()
    const vistos: Ingrediente[][] = []
    escucharCambiosExternos(destino, (l) => vistos.push(l))
    disparar(destino, CLAVE, serializarDespensa([lote('a', 'DesdeA')]))
    expect(vistos).toEqual([[lote('a', 'DesdeA')]])
  })

  it('una lista vacía válida también se entrega (la otra pestaña borró todo)', () => {
    const destino = new EventTarget()
    const vistos: Ingrediente[][] = []
    escucharCambiosExternos(destino, (l) => vistos.push(l))
    disparar(destino, CLAVE, serializarDespensa([]))
    expect(vistos).toEqual([[]])
  })

  it('ignora otras claves', () => {
    const destino = new EventTarget()
    let llamadas = 0
    escucharCambiosExternos(destino, () => llamadas++)
    disparar(destino, 'otra-app', serializarDespensa([lote('a', 'X')]))
    expect(llamadas).toBe(0)
  })

  it('ignora datos corruptos, de formato viejo o borrados, sin lanzar error', () => {
    const destino = new EventTarget()
    let llamadas = 0
    escucharCambiosExternos(destino, () => llamadas++)
    for (const v of ['{no json', '[]', '{"version":0,"ingredientes":[]}', null]) expect(() => disparar(destino, CLAVE, v)).not.toThrow()
    expect(llamadas).toBe(0)
  })

  it('al cancelar la suscripción ya no escucha', () => {
    const destino = new EventTarget()
    let llamadas = 0
    const parar = escucharCambiosExternos(destino, () => llamadas++)
    parar()
    disparar(destino, CLAVE, serializarDespensa([lote('a', 'X')]))
    expect(llamadas).toBe(0)
  })
})
