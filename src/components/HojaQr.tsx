import { useState } from 'react'
import { CodigoQr } from './CodigoQr'
import { Hoja } from './Hoja'
import { IconoDescarga, IconoUsar } from './Iconos'

export const URL_APK = 'https://github.com/nena0237/Hackathon-ITM/raw/apk/food-saver.apk'

interface Props {
  cerrando: boolean
  abridor: HTMLElement | null
  onSolicitarCierre: () => void
  onCerrado: () => void
}

/** Hoja accesible con el código QR y enlace directo para descargar el APK de Android. */
export function HojaQr({ cerrando, abridor, onSolicitarCierre, onCerrado }: Props) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(URL_APK)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Hoja
      titulo="App Android (APK)"
      etiqueta="Descargar aplicación Android mediante código QR"
      clave="apk-qr"
      cerrando={cerrando}
      abridor={abridor}
      onSolicitarCierre={onSolicitarCierre}
      onCerrado={onCerrado}
    >
      <div className="space-y-4">
        <p className="text-base text-tinta">
          Escanea este código QR con la cámara de tu celular Android para descargar e instalar <strong>Food Saver</strong>.
        </p>

        <div className="flex justify-center">
          <div className="rounded-3xl border-2 border-tinta bg-white p-4">
            <CodigoQr valor={URL_APK} etiqueta="Código QR para descargar Food Saver APK" className="size-56" />
          </div>
        </div>

        <p className="break-all rounded-2xl border border-tinta/20 bg-white/70 px-3 py-2 text-center text-xs font-medium text-tinta-suave select-all">
          {URL_APK}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={URL_APK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-tinta px-4 text-base font-semibold text-crema"
          >
            <IconoDescarga />
            Descargar APK
          </a>
          <button
            type="button"
            onClick={copiar}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-tinta px-4 text-base font-semibold text-tinta"
          >
            {copiado && <IconoUsar className="size-4" />}
            {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </Hoja>
  )
}
