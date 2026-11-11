import { crearSeed } from '../data/seed'
import { leerDespensa, serializarDespensa } from '../domain/persistencia'
import type { Fecha, Ingrediente } from '../domain/tipos'

export const CLAVE = 'foodsaver:v1'
export const CLAVE_RESPALDO = 'foodsaver:v1:respaldo'

/** Lo mínimo que necesitamos de `localStorage` (permite probar con uno falso en memoria). */
export type Almacen = Pick<Storage, 'getItem' | 'setItem'>

export interface CargaInicial {
  ingredientes: Ingrediente[]
  /** Mensaje para mostrar al usuario si algo no salió como se esperaba. */
  aviso: string | null
  origen: 'guardado' | 'seed'
}

/** `localStorage` si el navegador lo permite; `null` si está bloqueado o no existe. */
export function obtenerAlmacen(): Almacen | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/** Guarda la despensa. Devuelve false (sin lanzar) si no se pudo (cuota llena, modo privado…). */
export function guardarDespensa(almacen: Almacen | null, ingredientes: readonly Ingrediente[]): boolean {
  if (!almacen) return false
  try {
    almacen.setItem(CLAVE, serializarDespensa(ingredientes))
    return true
  } catch {
    return false
  }
}

const SIN_GUARDADO =
  'Este navegador no permite guardar datos: lo que cambies se perderá al recargar la página.'

/**
 * Carga la despensa al abrir la app. Nunca lanza:
 *  - sin datos → seed (con fechas relativas a `hoy`), que se guarda;
 *  - datos corruptos o de formato viejo → seed + aviso, y se conserva una copia del texto original;
 *  - sin acceso al almacenamiento → seed en memoria + aviso.
 */
export function cargarDespensa(almacen: Almacen | null, hoy: Fecha): CargaInicial {
  const conSeed = (aviso: string | null): CargaInicial => {
    const ingredientes = crearSeed(hoy)
    const guardado = guardarDespensa(almacen, ingredientes)
    return { ingredientes, aviso: guardado ? aviso : [aviso, SIN_GUARDADO].filter(Boolean).join(' '), origen: 'seed' }
  }

  if (!almacen) return conSeed(null)

  let texto: string | null
  try {
    texto = almacen.getItem(CLAVE)
  } catch {
    return { ingredientes: crearSeed(hoy), aviso: SIN_GUARDADO, origen: 'seed' }
  }

  const lectura = leerDespensa(texto)
  switch (lectura.estado) {
    case 'ok':
      return { ingredientes: lectura.ingredientes, aviso: null, origen: 'guardado' }
    case 'vacio':
      return conSeed(null)
    case 'corrupto':
    case 'formato-viejo': {
      try {
        if (texto !== null) almacen.setItem(CLAVE_RESPALDO, texto)
      } catch {
        // sin respaldo: no es crítico
      }
      const que = lectura.estado === 'corrupto' ? 'estaban dañados' : 'tenían un formato anterior'
      return conSeed(`Los datos guardados ${que} (${lectura.motivo}). Cargamos los datos de ejemplo y guardamos una copia de los originales.`)
    }
  }
}
