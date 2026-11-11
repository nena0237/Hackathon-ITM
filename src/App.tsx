import { useState } from 'react'
import { useHoy } from './hooks/useHoy'
import { Despensa } from './pages/Despensa'
import { Recetas } from './pages/Recetas'
import type { CargaInicial } from './storage/almacen'

type Pestana = 'despensa' | 'recetas'

export default function App({ carga }: { carga: CargaInicial }) {
  const hoy = useHoy()
  const [pestana, setPestana] = useState<Pestana>('despensa')
  const [aviso, setAviso] = useState<string | null>(carga.aviso)
  // En esta fase la despensa solo se lee; la Fase 3 agrega altas, ediciones y borrados.
  const [ingredientes] = useState(carga.ingredientes)

  const boton = (id: Pestana, texto: string) => (
    <button
      type="button"
      onClick={() => setPestana(id)}
      aria-current={pestana === id ? 'page' : undefined}
      className={`min-h-12 flex-1 rounded-xl px-4 text-base font-semibold ${
        pestana === id ? 'bg-emerald-700 text-white' : 'bg-white text-stone-800 ring-1 ring-stone-300'
      }`}
    >
      {texto}
    </button>
  )

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-stone-50 px-4 pb-10 text-stone-900">
      <header className="py-4">
        <h1 className="text-2xl font-bold">🥗 Food Saver</h1>
        <p className="text-sm text-stone-600">Usa primero lo que vence antes y desperdicia menos.</p>
      </header>

      {aviso && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{aviso}</p>
          <button type="button" onClick={() => setAviso(null)} className="shrink-0 rounded-lg px-2 py-1 font-semibold underline">
            Entendido
          </button>
        </div>
      )}

      <nav aria-label="Secciones" className="mb-4 flex gap-2">
        {boton('despensa', 'Despensa')}
        {boton('recetas', 'Recetas')}
      </nav>

      <main>{pestana === 'despensa' ? <Despensa ingredientes={ingredientes} hoy={hoy} /> : <Recetas ingredientes={ingredientes} hoy={hoy} />}</main>
    </div>
  )
}
