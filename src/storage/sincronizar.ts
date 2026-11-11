import { leerDespensa } from '../domain/persistencia'
import type { Ingrediente } from '../domain/tipos'
import { CLAVE } from './almacen'

/**
 * Escucha el evento `storage` (el navegador lo dispara en las OTRAS pestañas cuando una guarda)
 * y entrega la lista nueva. Ignora otras claves y datos que no se puedan leer: nunca pisa lo
 * que esta pestaña muestra con basura. Devuelve la función para dejar de escuchar.
 */
export function escucharCambiosExternos(
  destino: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  alCambiar: (ingredientes: Ingrediente[]) => void,
): () => void {
  const manejar = (e: Event) => {
    const { key, newValue } = e as Event & { key: string | null; newValue: string | null }
    if (key !== CLAVE) return
    const lectura = leerDespensa(newValue)
    if (lectura.estado === 'ok') alCambiar(lectura.ingredientes)
  }
  destino.addEventListener('storage', manejar)
  return () => destino.removeEventListener('storage', manejar)
}
