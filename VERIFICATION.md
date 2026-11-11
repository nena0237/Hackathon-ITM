# VERIFICATION.md

Registro de bugs reales: síntoma, causa raíz investigada, fix y re-prueba. Las filas "detectado por tests propios" salieron de la suite del propio constructor durante la Fase 1; la auditoría cruzada independiente (Fase 5) se agrega debajo.

| Prueba | Resultado | Bug | Causa raíz | Fix | Re-prueba |
|---|---|---|---|---|---|
| detectado por tests propios (F1) — `despensa.test.ts`: "ordena de la fecha más cercana a la más lejana", "compara fechas como fechas (cruce de año)", "cada grupo queda ordenado por vencimiento" | 3 tests fallaron: se esperaba `['Leche','Pollo','Tomate','Arroz']` y se obtuvo `['Arroz','Tomate','Pollo','Leche']` | `ordenarPorVencimiento` ordenaba al revés (de la fecha más lejana a la más cercana); `separarVencidos` heredaba el error (vencidos del más reciente al más antiguo) | En `src/domain/despensa.ts` el comparador era `diasParaVencer(a.vence, b.vence) * -1`. `diasParaVencer(a, b)` ya devuelve `a − b` (positivo si `a` vence después), que es justo el signo de un orden ascendente; el `* -1` de más lo invertía. | Se quitó el `* -1`: el comparador es `diasParaVencer(a.vence, b.vence) \|\| comparación por nombre`. | `npm test`: los 3 tests pasan (168/168). Además, un mutante que invierte el desempate por nombre ("desempate por nombre invertido") sigue haciendo fallar un test. |
| detectado por tests propios (F1) — `validacion.test.ts`: "formato inválido 20260315 → mensaje de fecha no válida" | 1 test falló: con la fecha como número `20260315` el mensaje fue "La fecha de vencimiento es obligatoria." en vez de "La fecha no es válida…" | Orden/ramas de validación de fecha mal: un valor presente pero de tipo equivocado se trataba como "vacío" | En `src/domain/validacion.ts` la condición de "obligatoria" era `typeof entrada.vence !== 'string' \|\| entrada.vence.trim() === ''`, que mezclaba "ausente" con "no es texto". El chequeo "no es válida" nunca se alcanzaba para valores no-string. | La rama "obligatoria" ahora solo cubre `null`/`undefined`/texto en blanco: `entrada.vence == null \|\| (typeof entrada.vence === 'string' && entrada.vence.trim() === '')`. Todo lo demás pasa a `esFechaValida`. | `npm test`: el test pasa y los 6 valores de formato inválido (incluido el número) dan "no es válida"; los valores vacíos siguen dando "obligatoria". |
| detectado por tests propios (F1) — `validacion.test.ts`: "normalizarNombre no altera nombres con símbolos o números (sin marcadores internos)" y "conserva la ñ… precompuesta o descompuesta" (escritos al detectar el riesgo; el mutante "no quita tildes" no se había aplicado y reveló el problema) | La versión intermedia convertía un nombre como `Mix 0001 #1` en `mixñ…`: un texto del usuario se confundía con el marcador interno. Además, el regex de tildes tenía caracteres combinantes invisibles escritos literalmente | `normalizarNombre` protegía la ñ reemplazándola por un marcador de texto (`'#'`, luego `'0001'` tras un `sed` mío) para restaurarla después de `normalize('NFD')`. Cualquier nombre que contuviera el marcador se corrompía al restaurarse. | Se eliminó el marcador: se hace `normalize('NFC')`, se separa el texto por `ñ`, se quitan las marcas diacríticas (`\p{M}`) de cada parte y se vuelve a unir con `ñ`. | `npm test`: pasa el test de `Mix 0001 #1`, el de `piña` (ñ descompuesta → `piña`) y `Añejo ÁÉÍÓÚ` → `añejo aeiou`. Mutantes "no quita tildes" y "ñ se pierde" hacen fallar tests. |
| detectado por revisión de captura + medición (F4) — la captura de Despensa a 360 px salió de 362 px de ancho; se midió `scrollWidth` y los elementos que sobrepasan el viewport | `scrollWidth` = 362 con `clientWidth` = 360; único elemento fuera: el botón "Agregar" (borde derecho en x = 361,5) | Scroll horizontal de 2 px en la Despensa a 360 px (la pantalla "se mueve" de lado) | La cabecera era `flex justify-between` con el título de 44 px (unos 205 px) más el botón "Agregar" (`px-5`, unos 125 px) y el espacio entre ambos: más de los 328 px disponibles a 360 px; el botón no podía encogerse ni bajar de línea | Botón con menos padding y `shrink-0`; la cabecera pasó a `flex-wrap` (si no cabe junto al título, el botón baja a la línea siguiente, que es lo que ocurre a 360 px) | Medición: `scrollWidth` = 360 y ningún elemento fuera. `e2e-fase4.mjs` ahora comprueba que no hay scroll horizontal a 360 px en Despensa, Recetas y con la hoja abierta |
| detectado por `e2e-fase4.mjs` (F4) — "El escalonado se detiene en 8 elementos" | Con 14 ingredientes, los retrasos de entrada eran 0 · 60 · … · 420 ms y se quedaban en 420 ms del 8.º al 14.º | Del 9.º ingrediente en adelante cada banda esperaba 420 ms antes de aparecer al hacer scroll, cuando el brief pide escalonar como máximo 8 elementos | `Math.min(indice, 7)` fija el retraso en el tope en vez de anularlo para los elementos que pasan del 8.º | Función pura `posicionEscalonada` (0 a 7 conserva la posición, del 9.º en adelante vale 0) con 3 tests, usada en `FilaTiempo` y `BloqueReceta` | `npm test` (288 pasan) y `e2e-fase4.mjs`: retrasos 0 · 0,06 · … · 0,42 s y `0s` del 9.º al 14.º |

## Pruebas de navegador (interfaz real)

Scripts en `scripts/`, hechos con Playwright sobre Edge/Chrome real. **No son parte del proyecto:** `playwright-core` NO está en `package.json` y hay que instalarlo aparte.

```bash
npm install --no-save playwright-core   # instala sin tocar package.json ni package-lock.json
npm run dev                             # en otra terminal (puerto 5173)
node scripts/e2e-fase2.mjs              # flujo de demo, orden, vencidos, recarga, corrupto, cambio de día (49 comprobaciones)
node scripts/e2e-fase3.mjs              # agregar/editar/usé/borrar con recarga, casos hostiles, estado vacío, hoja inferior (72 comprobaciones)
node scripts/e2e-fase4.mjs              # diseño sobre el CSS renderizado: paleta, tipografía, anatomía, contraste, táctil, movimiento (85 comprobaciones)
node scripts/capturas.mjs               # regenera docs/capturas/ (360 px y 1280 px)
```

- Cada script imprime `OK` / `FALLA` por comprobación y termina con `TODO OK` (código de salida 0) o `N FALLOS`. Guardan capturas en `capturas/` (ignorada por git).
- Variables opcionales: `URL` (por defecto `http://localhost:5173/`) y `EDGE_PATH` (por defecto la ruta de Edge en Windows; en otros sistemas apunta a un Chrome/Edge instalado).
- Usan el reloj simulado de Playwright (`page.clock`) para probar el cambio de día sin esperar.
- Si luego corres `npm ci`, `playwright-core` se borra de `node_modules` (es lo esperado: vuelve a instalarlo con el comando de arriba).

### Resultado Fase 3 (interfaz real, recargando después de cada operación)

| Prueba | Resultado |
|---|---|
| Agregar (con "2,5") + recarga | OK, persiste |
| Nombre repetido → 2 lotes + recarga | OK |
| Cantidad `0`, `-3`, `abc`, vacía, `1e9`, `1000000000`, `Infinity` | Rechazadas con mensaje bajo el campo; no se agrega nada |
| Nombre de 200 caracteres; fecha vacía; formulario vacío (3 errores, foco al primero) | Rechazados con mensaje claro |
| Fecha de ayer | Se acepta y cae en Vencidos (+ recarga) |
| Editar (datos actuales precargados, cantidad 0 rechazada, cambio de fecha de vencido a vigente) + recarga | OK; las recetas reaccionan |
| "Usé" con `0`, `-1`, `abc`, vacío, `7` y `6,01` sobre 6 unidades | Rechazados; nada cambia |
| "Usé" 2 + recarga; "Usé" todo (llega a 0) + recarga | OK; a 0 el lote se elimina y no vuelve |
| Borrar con confirmación propia (cancelar / confirmar) + recarga | OK; ningún `alert`/`confirm` del navegador |
| Borrar todo → estado vacío + recarga; recetas con despensa vacía | OK (12 parciales, 0 cocinables) |
| "Cargar datos de ejemplo" 10 días después de lo guardado | El Pollo vence HOY (fechas del día actual, no las guardadas) |

**Los scripts también se verificaron a sí mismos** (mutación de la app): permitir descontar de más hizo fallar el chequeo de `7`; dejar de guardar en `localStorage` hizo fallar 4 chequeos de recarga; usar fechas fijas en "cargar ejemplo" hizo fallar 3 chequeos. Con el código original vuelve a dar `TODO OK`.

### Fase 4 — verificación del diseño

`e2e-fase4.mjs` no mira el código sino el **CSS ya renderizado** en Edge real (`getComputedStyle`, `getAnimations`, medidas, red). 85 comprobaciones, entre otras:

| Qué se verifica | Cómo |
|---|---|
| La demo no depende de internet | Ninguna petición fuera de `localhost`; las fuentes salen de `.woff2` del propio proyecto |
| Paleta y tipografía | Color calculado de cada banda (coral, coral claro, mango, mango claro, lima, lima claro), gris rayado a 135° en vencidos, fondo crema, título 44 px / peso 800 / tracking −0.03em, nombre 24 px y 18 px; ni Inter, ni Roboto, ni Arial en ningún elemento |
| Anatomía de la fila | Columna de 50 px, línea de 4 px que cambia de color por tramo, nodo de 16 px con aro de tinta, esquina izquierda de 18 px, banda hasta el borde derecho, línea punteada y X en vencidos, anillo que pulsa solo en "Hoy" |
| Estado = color + ícono + texto | Ninguna banda sin ícono o sin texto |
| Contraste | WCAG calculado sobre 41 pares de texto reales (incluye los dos tonos del rayado): el peor es 4,60:1 (aviso sobre gris-b), todos ≥ 4,5:1 |
| Táctil y foco | Todos los botones ≥ 44 px (Despensa, hoja y Recetas), contorno de foco visible de 3 px, etiquetas visibles, `aria-label` en botones solo de ícono, íconos con `aria-hidden` |
| Movimiento | Solo `transform` y `opacity`; 520 ms y escalonado de 60 ms (máximo 8); easing único; hoja 320 ms al abrir y 200 ms al cerrar; la banda se comprime a `scaleY(.96)` en 100 ms; revelado una sola vez; encabezados sticky; aviso con `aria-live="polite"` que no roba el foco y se retira a los 4 s |
| `prefers-reduced-motion` | Solo fundidos de 150 ms (solo opacidad), sin retraso, sin pulso y la hoja aparece con fundido |
| Recetas | Cocinable lima, "No alcanza" rayado, mini línea de tiempo, preparación plegada |

**Prueba de mutación del script** (se rompió el diseño a propósito y se comprobó que algo falla): rojo de aviso más claro (falla el contraste: 2,80:1), aro del nodo de 1 px, pulso activo con movimiento reducido, easing con rebote. Los 4 se detectan. En la hoja inferior (`e2e-fase3.mjs`): sin trampa de foco, sin devolver el foco y sin cerrar con Escape. Los 3 se detectan. Todo restaurado después (`cmp` contra la copia).

**Errores de mis propias pruebas encontrados en esta fase** (no eran bugs de la app, pero habrían dado falsa seguridad):
- El chequeo de contraste medía el elemento equivocado (`span:last-child` agarraba la cantidad "1 l" y no el texto "Hace N días"), así que el par más justo nunca se medía y el "peor" salía 6,01. Lo detecté porque no cuadraba con el 4,60 de `DISENO.md`; se corrigió con `:scope >`.
- Mis reemplazos con `String.replace` convirtieron `$$eval` en `$eval` (en JS `$$` dentro del texto de reemplazo significa `$`) y el shell se comió barras invertidas de dos regex. Se corrigieron con la herramienta de edición.
- Tres comprobaciones eran frágiles (fechas con `textContent` sin espacios, sticky con una página demasiado corta para pasar el encabezado, aviso medido justo en el límite de 4,2 s) y se arreglaron para que prueben lo que dicen.
