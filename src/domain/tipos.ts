export type Unidad = 'g' | 'kg' | 'ml' | 'l' | 'unidad'
export const UNIDADES: readonly Unidad[] = ['g', 'kg', 'ml', 'l', 'unidad']

/** Fecha en formato YYYY-MM-DD (solo día, hora local). */
export type Fecha = string

export interface Ingrediente {
  id: string
  nombre: string
  cantidad: number
  unidad: Unidad
  vence: Fecha
}

/** Entrada cruda de un formulario: todo puede venir mal. */
export interface IngredienteEntrada {
  nombre: unknown
  cantidad: unknown
  unidad: unknown
  vence: unknown
}

export type IngredienteValido = Omit<Ingrediente, 'id'>

export type CampoIngrediente = 'nombre' | 'cantidad' | 'unidad' | 'vence'

export type ResultadoValidacion =
  | { ok: true; valor: IngredienteValido }
  | { ok: false; errores: Partial<Record<CampoIngrediente, string>> }

export interface RecetaIngrediente {
  nombre: string
  cantidad: number
  unidad: Unidad
}

export interface Receta {
  id: string
  nombre: string
  ingredientes: RecetaIngrediente[]
  instrucciones: string
}

export type MotivoFaltante = 'no-hay' | 'insuficiente' | 'vencido' | 'unidad-incompatible'

export interface Faltante {
  nombre: string
  unidad: Unidad
  necesita: number
  disponible: number
  /** Cuánto falta, en la unidad de la receta. */
  falta: number
  motivo: MotivoFaltante
}

export interface IngredienteAprovechado {
  nombre: string
  /** Días para vencer del lote más urgente (0 a 3). */
  dias: number
}

export interface Sugerencia {
  receta: Receta
  estado: 'cocinable' | 'parcial'
  faltantes: Faltante[]
  aprovecha: IngredienteAprovechado[]
  /** Cantidad de ingredientes por vencer que aprovecha. */
  urgencia: number
}
