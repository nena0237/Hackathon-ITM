import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { IconoX } from './Iconos'

const SALIDA_MS = 200
const FOCALIZABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface Props {
  /** Título visible. */
  titulo: string
  /** Nombre accesible del diálogo. */
  etiqueta: string
  rol?: 'dialog' | 'alertdialog'
  /** Cambia cuando cambia el contenido (opciones → formulario) para mover el foco adentro. */
  clave: string
  cerrando: boolean
  /** Elemento que abrió la hoja: recupera el foco al cerrar. */
  abridor: HTMLElement | null
  onSolicitarCierre: () => void
  /** Se llama cuando terminó la animación de salida: el padre desmonta la hoja. */
  onCerrado: () => void
  children: ReactNode
}

/**
 * Hoja inferior accesible: foco atrapado, Escape la cierra, clic fuera la cierra,
 * y al cerrar el foco vuelve al elemento que la abrió.
 */
export function Hoja({ titulo, etiqueta, rol = 'dialog', clave, cerrando, abridor, onSolicitarCierre, onCerrado, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const contenido = useRef<HTMLDivElement>(null)
  const solicitar = useRef(onSolicitarCierre)
  solicitar.current = onSolicitarCierre

  // Enfoca el primer campo/botón del contenido cada vez que cambia el contenido.
  useEffect(() => {
    const destino = contenido.current?.querySelector<HTMLElement>('input, select, textarea, button') ?? ref.current
    destino?.focus()
  }, [clave])

  // Escape y trampa de foco.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        solicitar.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCALIZABLES)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const primero = items[0]
      const ultimo = items[items.length - 1]
      const activo = document.activeElement
      if (!ref.current.contains(activo)) {
        e.preventDefault()
        primero.focus()
      } else if (e.shiftKey && activo === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [])

  // Bloquea el scroll del fondo mientras está abierta.
  useEffect(() => {
    const previo = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previo
    }
  }, [])

  // Salida: espera la animación, devuelve el foco y avisa al padre.
  const devolverFoco = useCallback(() => {
    const destino = abridor && abridor.isConnected ? abridor : document.getElementById('contenido-principal')
    destino?.focus()
  }, [abridor])
  useEffect(() => {
    if (!cerrando) return
    const t = window.setTimeout(() => {
      devolverFoco()
      onCerrado()
    }, SALIDA_MS)
    return () => window.clearTimeout(t)
  }, [cerrando, devolverFoco, onCerrado])

  return (
    <>
      <div className="hoja-fondo" data-cerrando={cerrando} onClick={() => solicitar.current()} aria-hidden="true" />
      <div
        ref={ref}
        className="hoja"
        role={rol}
        aria-modal="true"
        aria-label={etiqueta}
        data-cerrando={cerrando}
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-3xl leading-none">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={() => solicitar.current()}
            aria-label="Cerrar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-tinta text-crema"
          >
            <IconoX />
          </button>
        </div>
        <div ref={contenido}>{children}</div>
      </div>
    </>
  )
}
