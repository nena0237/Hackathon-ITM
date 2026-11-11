import { useCallback, useEffect, useState } from 'react'
import { BarraInferior, type Pestana } from './components/BarraInferior'
import { IconoUsar } from './components/Iconos'
import { useDespensa } from './hooks/useDespensa'
import { useHoy } from './hooks/useHoy'
import { Despensa } from './pages/Despensa'
import { Recetas } from './pages/Recetas'
import type { CargaInicial } from './storage/almacen'

interface Mensaje {
  texto: string
  saliendo: boolean
}

export default function App({ carga }: { carga: CargaInicial }) {
  const hoy = useHoy()
  const { ingredientes, acciones, falloGuardar } = useDespensa(carga, hoy)
  const [pestana, setPestana] = useState<Pestana>('despensa')
  const [aviso, setAviso] = useState<string | null>(carga.aviso)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)

  const avisar = useCallback((texto: string) => setMensaje({ texto, saliendo: false }), [])

  // El aviso de éxito se retira solo a los 4 s (con una salida corta de 200 ms) y nunca roba el foco.
  useEffect(() => {
    if (!mensaje || mensaje.saliendo) return
    const salir = window.setTimeout(() => setMensaje((m) => (m ? { ...m, saliendo: true } : m)), 4000)
    return () => window.clearTimeout(salir)
  }, [mensaje])
  useEffect(() => {
    if (!mensaje?.saliendo) return
    const quitar = window.setTimeout(() => setMensaje(null), 200)
    return () => window.clearTimeout(quitar)
  }, [mensaje?.saliendo])

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-32">
      {aviso && (
        <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-2xl bg-mango px-4 py-3 text-base">
          <p className="font-medium">{aviso}</p>
          <button type="button" onClick={() => setAviso(null)} className="min-h-11 shrink-0 rounded-full px-3 font-semibold underline underline-offset-4">
            Entendido
          </button>
        </div>
      )}

      {falloGuardar && (
        <p role="alert" className="mt-4 rounded-2xl bg-coral px-4 py-3 text-base font-semibold">
          No se pudo guardar en este navegador: los cambios se perderán al recargar.
        </p>
      )}

      <main id="contenido-principal" tabIndex={-1} className="outline-none">
        {pestana === 'despensa' ? (
          <Despensa ingredientes={ingredientes} hoy={hoy} acciones={acciones} avisar={avisar} />
        ) : (
          <Recetas ingredientes={ingredientes} hoy={hoy} />
        )}
      </main>

      <div role="status" aria-live="polite">
        {mensaje && (
          <p className="aviso-exito flex items-center gap-2 rounded-2xl bg-lima px-4 py-3 text-base font-semibold" data-saliendo={mensaje.saliendo}>
            <IconoUsar className="size-5 shrink-0" />
            {mensaje.texto}
          </p>
        )}
      </div>

      <BarraInferior activa={pestana} onCambiar={setPestana} />
    </div>
  )
}
