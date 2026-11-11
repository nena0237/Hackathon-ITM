import { IconoDespensa, IconoRecetas } from './Iconos'

export type Pestana = 'despensa' | 'recetas'

/** Barra de navegación flotante tipo píldora. */
export function BarraInferior({ activa, onCambiar }: { activa: Pestana; onCambiar: (p: Pestana) => void }) {
  const segmento = (id: Pestana, texto: string, icono: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onCambiar(id)}
      aria-current={activa === id ? 'page' : undefined}
      className={`flex min-h-12 items-center gap-2 rounded-full px-5 text-base font-semibold ${activa === id ? 'bg-crema text-tinta' : 'text-crema'}`}
    >
      {icono}
      {texto}
    </button>
  )
  return (
    <nav
      aria-label="Secciones"
      className="sobre-tinta fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full bg-tinta p-1.5"
    >
      {segmento('despensa', 'Despensa', <IconoDespensa />)}
      {segmento('recetas', 'Recetas', <IconoRecetas />)}
    </nav>
  )
}
