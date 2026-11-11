import { useEffect, useState } from 'react'
import type { Fecha } from '../domain/tipos'
import { hoyLocal } from '../storage/reloj'

/**
 * Fecha local de hoy. Se vuelve a calcular cada 30 s y al volver a la pestaña,
 * así, si la app queda abierta pasada la medianoche, los estados cambian solos.
 */
export function useHoy(): Fecha {
  const [hoy, setHoy] = useState<Fecha>(() => hoyLocal())
  useEffect(() => {
    const actualizar = () => setHoy(hoyLocal())
    const id = window.setInterval(actualizar, 30_000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [])
  return hoy
}
