const sinTildes = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '')

/**
 * Normaliza un nombre para comparar: minúsculas, sin tildes, sin espacios extra.
 * La ñ se conserva (piña ≠ pina).
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFC') // une "n" + tilde suelta en "ñ" antes de separar por ñ
    .toLowerCase()
    .split('ñ')
    .map(sinTildes)
    .join('ñ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Plural simple de una palabra ya normalizada: "-es" tras n, r, l o d ("limones") o "-s" final ("huevos"). */
function singular(palabra: string): string {
  if (palabra.length < 4) return palabra // "res", "gas", "mes": no se tocan
  if (/[nrld]es$/.test(palabra)) return palabra.slice(0, -2)
  if (palabra.endsWith('s')) return palabra.slice(0, -1)
  return palabra
}

/**
 * Clave para COMPARAR ingredientes: el nombre normalizado y, palabra por palabra, sin plural simple.
 * "Huevo" = "huevos", "Tomates" = "tomate", "Limones" = "limón". El nombre que se muestra no cambia.
 */
export function claveNombre(nombre: string): string {
  return normalizarNombre(nombre).split(' ').map(singular).join(' ')
}
