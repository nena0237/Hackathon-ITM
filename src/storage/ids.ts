/** Id único para un ingrediente nuevo. Vive fuera del dominio porque usa azar/reloj. */
export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
