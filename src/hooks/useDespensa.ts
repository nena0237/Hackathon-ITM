import { useCallback, useEffect, useMemo, useState } from 'react'
import { crearSeed } from '../data/seed'
import { agregarValidado, editarValidado, eliminarIngrediente, usarIngrediente } from '../domain/despensa'
import type { Fecha, Ingrediente, IngredienteEntrada, ResultadoDespensa, ResultadoUso } from '../domain/tipos'
import { guardarDespensa, obtenerAlmacen, type CargaInicial } from '../storage/almacen'
import { nuevoId } from '../storage/ids'
import { escucharCambiosExternos } from '../storage/sincronizar'

export interface AccionesDespensa {
  agregar: (entrada: IngredienteEntrada) => ResultadoDespensa
  editar: (id: string, entrada: IngredienteEntrada) => ResultadoDespensa
  borrar: (id: string) => void
  usar: (id: string, cantidad: unknown) => ResultadoUso
  cargarEjemplo: () => void
}

/**
 * Estado de la despensa + persistencia. No decide nada de negocio: cada operación
 * llama a una función pura del dominio y, si salió bien, guarda el resultado.
 */
export function useDespensa(carga: CargaInicial, hoy: Fecha) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(carga.ingredientes)
  const [falloGuardar, setFalloGuardar] = useState(false)
  const almacen = useMemo(() => obtenerAlmacen(), [])

  const aplicar = useCallback(
    (nueva: Ingrediente[]) => {
      setIngredientes(nueva)
      setFalloGuardar(!guardarDespensa(almacen, nueva))
    },
    [almacen],
  )

  // Otra pestaña guardó: mostramos lo suyo en vez de pisarlo en la próxima acción (AC-3).
  useEffect(() => escucharCambiosExternos(window, setIngredientes), [])

  const acciones: AccionesDespensa = {
    agregar: (entrada) => {
      const r = agregarValidado(ingredientes, entrada, nuevoId())
      if (r.ok) aplicar(r.despensa)
      return r
    },
    editar: (id, entrada) => {
      const r = editarValidado(ingredientes, id, entrada)
      if (r.ok) aplicar(r.despensa)
      return r
    },
    borrar: (id) => aplicar(eliminarIngrediente(ingredientes, id)),
    usar: (id, cantidad) => {
      const r = usarIngrediente(ingredientes, id, cantidad)
      if (r.ok) aplicar(r.despensa)
      return r
    },
    // El seed se regenera con las fechas relativas a HOY (no con las guardadas antes).
    cargarEjemplo: () => aplicar(crearSeed(hoy)),
  }

  return { ingredientes, acciones, falloGuardar }
}
