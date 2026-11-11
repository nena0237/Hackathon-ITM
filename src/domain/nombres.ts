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
