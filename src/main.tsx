import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { cargarDespensa, obtenerAlmacen } from './storage/almacen'
import { hoyLocal } from './storage/reloj'

// La carga (y su posible aviso) se hace UNA vez, fuera de React: así StrictMode no la duplica.
const carga = cargarDespensa(obtenerAlmacen(), hoyLocal())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App carga={carga} />
  </StrictMode>,
)
