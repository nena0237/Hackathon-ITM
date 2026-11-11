import { useMemo, useState } from 'react'
import { ConfirmarBorrado } from '../components/ConfirmarBorrado'
import { FilaTiempo } from '../components/FilaTiempo'
import { FormularioIngrediente } from '../components/FormularioIngrediente'
import { FormularioUso } from '../components/FormularioUso'
import { Hoja } from '../components/Hoja'
import { IconoMas, IconoReloj, IconoX } from '../components/Iconos'
import { OpcionesIngrediente } from '../components/OpcionesIngrediente'
import { estadoVencimiento } from '../domain/fechas'
import { agruparPorUrgencia, capitalizarNombre } from '../domain/formato'
import { cantidadATexto } from '../domain/presentacion'
import type { Fecha, Ingrediente } from '../domain/tipos'
import type { AccionesDespensa } from '../hooks/useDespensa'

type Vista = { tipo: 'agregar' } | { tipo: 'opciones' | 'editar' | 'usar' | 'borrar'; id: string }
interface HojaAbierta {
  vista: Vista
  abridor: HTMLElement | null
  /** Copia del ingrediente al abrir: la hoja sigue mostrando su nombre mientras sale tras borrarlo. */
  copia?: Ingrediente
}

interface Props {
  ingredientes: Ingrediente[]
  hoy: Fecha
  acciones: AccionesDespensa
  avisar: (mensaje: string) => void
}

function Seccion({
  id, titulo, nota, vacio, ingredientes, hoy, compacta, testid, onAbrir,
}: {
  id: string; titulo: string; nota?: string; vacio: string; ingredientes: Ingrediente[]; hoy: Fecha; compacta?: boolean; testid: string
  onAbrir: (i: Ingrediente, boton: HTMLElement) => void
}) {
  return (
    <section aria-labelledby={id}>
      <div className="encabezado-seccion">
        <h2 id={id} className="text-[26px] leading-tight">
          {titulo} <span className="font-texto text-lg font-semibold tracking-normal text-tinta-suave">{ingredientes.length}</span>
        </h2>
        {nota && <p className="text-sm text-tinta-suave">{nota}</p>}
      </div>
      {ingredientes.length > 0 ? (
        <ul data-testid={testid}>
          {ingredientes.map((i, n) => (
            <FilaTiempo key={i.id} ingrediente={i} hoy={hoy} indice={n} compacta={compacta} onAbrir={(b) => onAbrir(i, b)} />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-base text-tinta-suave">{vacio}</p>
      )}
    </section>
  )
}

export function Despensa({ ingredientes, hoy, acciones, avisar }: Props) {
  const grupos = useMemo(() => agruparPorUrgencia(ingredientes, hoy), [ingredientes, hoy])
  const [hoja, setHoja] = useState<HojaAbierta | null>(null)
  const [cerrando, setCerrando] = useState(false)

  const abrir = (vista: Vista, abridor: HTMLElement | null, copia?: Ingrediente) => {
    setCerrando(false)
    setHoja({ vista, abridor, copia })
  }
  const cambiarVista = (vista: Vista) => setHoja((h) => (h ? { ...h, vista } : h))
  const solicitarCierre = () => setCerrando(true)
  const alCerrar = () => {
    setHoja(null)
    setCerrando(false)
  }

  const botonAgregar = (texto: string, extra = '') => (
    <button
      type="button"
      onClick={(e) => abrir({ tipo: 'agregar' }, e.currentTarget)}
      className={`flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-tinta pl-3.5 pr-4 text-base font-semibold text-crema ${extra}`}
    >
      <IconoMas />
      {texto}
    </button>
  )

  const contenidoHoja = () => {
    if (!hoja) return null
    const { vista } = hoja
    if (vista.tipo === 'agregar')
      return {
        titulo: 'Agregar ingrediente',
        etiqueta: 'Agregar ingrediente',
        rol: 'dialog' as const,
        cuerpo: (
          <FormularioIngrediente
            titulo="Agregar ingrediente"
            textoBoton="Guardar"
            onCancelar={solicitarCierre}
            onGuardar={(entrada) => {
              const r = acciones.agregar(entrada)
              if (!r.ok) return r.errores
              avisar('Ingrediente guardado.')
              solicitarCierre()
              return null
            }}
          />
        ),
      }
    const i = ingredientes.find((x) => x.id === vista.id) ?? hoja.copia
    if (!i) return null
    const nombre = capitalizarNombre(i.nombre)
    const vigente = estadoVencimiento(i.vence, hoy) !== 'vencido'
    if (vista.tipo === 'opciones')
      return {
        titulo: nombre,
        etiqueta: `Opciones de ${nombre}`,
        rol: 'dialog' as const,
        cuerpo: (
          <OpcionesIngrediente
            ingrediente={i}
            hoy={hoy}
            puedeUsar={vigente}
            onUsar={() => cambiarVista({ tipo: 'usar', id: i.id })}
            onEditar={() => cambiarVista({ tipo: 'editar', id: i.id })}
            onBorrar={() => cambiarVista({ tipo: 'borrar', id: i.id })}
          />
        ),
      }
    if (vista.tipo === 'editar')
      return {
        titulo: `Editar ${nombre}`,
        etiqueta: `Editar ${nombre}`,
        rol: 'dialog' as const,
        cuerpo: (
          <FormularioIngrediente
            titulo={`Editar ${nombre}`}
            textoBoton="Guardar cambios"
            inicial={{ nombre: i.nombre, cantidad: cantidadATexto(i.cantidad), unidad: i.unidad, vence: i.vence }}
            onCancelar={solicitarCierre}
            onGuardar={(entrada) => {
              const r = acciones.editar(i.id, entrada)
              if (!r.ok) return r.errores
              avisar('Cambios guardados.')
              solicitarCierre()
              return null
            }}
          />
        ),
      }
    if (vista.tipo === 'usar')
      return {
        titulo: `Usé ${nombre}`,
        etiqueta: `Usé ${nombre}`,
        rol: 'dialog' as const,
        cuerpo: (
          <FormularioUso
            ingrediente={i}
            onCancelar={solicitarCierre}
            onUsar={(cantidad) => {
              const r = acciones.usar(i.id, cantidad)
              if (!r.ok) return r.error
              avisar(r.eliminado ? `Usaste todo: ${nombre} salió de la despensa.` : 'Cantidad descontada.')
              solicitarCierre()
              return null
            }}
          />
        ),
      }
    return {
      titulo: `¿Borrar ${nombre}?`,
      etiqueta: `Confirmar borrado de ${nombre}`,
      rol: 'alertdialog' as const,
      cuerpo: (
        <ConfirmarBorrado
          ingrediente={i}
          onCancelar={solicitarCierre}
          onConfirmar={() => {
            acciones.borrar(i.id)
            avisar(`${nombre} borrado.`)
            solicitarCierre()
          }}
        />
      ),
    }
  }

  const c = contenidoHoja()
  const vistaActual = hoja?.vista
  const hojaJsx =
    hoja && c ? (
      <Hoja
        titulo={c.titulo}
        etiqueta={c.etiqueta}
        rol={c.rol}
        clave={vistaActual ? `${vistaActual.tipo}-${'id' in vistaActual ? vistaActual.id : ''}` : ''}
        cerrando={cerrando}
        abridor={hoja.abridor}
        onSolicitarCierre={solicitarCierre}
        onCerrado={alCerrar}
      >
        {c.cuerpo}
      </Hoja>
    ) : null

  const abrirOpciones = (i: Ingrediente, boton: HTMLElement) => abrir({ tipo: 'opciones', id: i.id }, boton, i)

  const encabezado = (extra?: React.ReactNode) => (
    <header className="pb-4 pt-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tinta-suave">Food Saver</p>
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-3">
        <h1 className="text-[44px] leading-none">Despensa</h1>
        {extra}
      </div>
    </header>
  )

  if (ingredientes.length === 0) {
    return (
      <>
        {encabezado()}
        <div className="rayado -mx-4 space-y-4 px-4 py-8" data-testid="estado-vacio">
          <h2 className="text-[30px] leading-tight">Tu despensa está vacía.</h2>
          <p className="text-lg font-medium">
            Agrega lo que tengas en casa para saber qué usar primero y qué recetas puedes cocinar, o carga datos de ejemplo para probar la app.
          </p>
          <div className="flex flex-col gap-3">
            {botonAgregar('Agregar ingrediente', 'justify-center')}
            <button
              type="button"
              className="min-h-12 rounded-full border-2 border-tinta px-5 text-base font-semibold"
              onClick={() => {
                acciones.cargarEjemplo()
                avisar('Cargamos los datos de ejemplo con fechas de hoy.')
              }}
            >
              Cargar datos de ejemplo
            </button>
          </div>
        </div>
        {hojaJsx}
      </>
    )
  }

  const nVencidos = grupos.vencidos.length
  return (
    <>
      {encabezado(botonAgregar('Agregar'))}
      <p className="mb-2 flex flex-nowrap items-center gap-2 whitespace-nowrap" data-testid="resumen">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mango px-3 py-1.5 text-sm font-semibold">
          <IconoReloj className="size-4" />
          {grupos.usarPrimero.length} por vencer
        </span>
        <span className="rayado inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
          <IconoX className="size-4" />
          {nVencidos} {nVencidos === 1 ? 'vencido' : 'vencidos'}
        </span>
      </p>

      <div className="space-y-6">
        <Seccion
          id="sec-usar-primero" titulo="Usar primero" nota="Vencen en 0 a 3 días."
          vacio="Nada urge por ahora." ingredientes={grupos.usarPrimero} hoy={hoy} testid="lista-usar-primero" onAbrir={abrirOpciones}
        />
        <Seccion
          id="sec-con-tiempo" titulo="Con tiempo" compacta
          vacio="No tienes más ingredientes vigentes." ingredientes={grupos.conTiempo} hoy={hoy} testid="lista-con-tiempo" onAbrir={abrirOpciones}
        />
        <Seccion
          id="sec-vencidos" titulo="Ya vencieron · no entran en recetas" compacta
          vacio="Nada vencido: bien hecho." ingredientes={grupos.vencidos} hoy={hoy} testid="lista-vencidos" onAbrir={abrirOpciones}
        />
      </div>
      {hojaJsx}
    </>
  )
}
