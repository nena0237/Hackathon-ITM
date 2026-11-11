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

## Auditoría cruzada (Fase 5, parte B)

> **Limitación:** La auditoría la hizo el mismo agente que construyó, en sesión nueva y sin leer PLAN.md; la independencia es parcial.

**Método.** Lectura de `src/domain`, `src/storage`, `src/hooks`, las hojas inferiores y las 22 recetas. Cada sospecha se reprodujo antes de registrarla: con tests desechables de Vitest sobre el dominio y con scripts de Playwright (Edge real, 360 px, reloj simulado en 2026-03-15) sobre la app en `localhost:5173`. Los scripts y tests desechables no se guardaron en el repositorio. No se corrigió nada. La columna "Fix / Re-prueba" queda pendiente para la corrección.

### Resumen priorizado

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| AC-1 | Alta | Enter repetido en la hoja ejecuta la acción dos veces ("Usé" descuenta doble; "Agregar" duplica el lote) | Corregido |
| AC-2 | Media | "Huevo", "Tomates": el singular/plural no coincide con las recetas y dice "no tienes" | Reproducido |
| AC-3 | Media | Dos pestañas abiertas se pisan: gana la última escritura y se pierde lo de la otra | Reproducido |
| AC-4 | Media | Escape, clic en el fondo o X descartan lo escrito sin avisar | Reproducido |
| AC-5 | Baja | Un solo registro inválido descarta toda la despensa guardada | Reproducido |
| AC-6 | Baja | "1.000" y "1,000" se aceptan como 1 (en Colombia el punto separa miles) | Reproducido |
| AC-7 | Baja | Ids duplicados en el almacenamiento: la hoja abre otro ingrediente y borrar/editar afecta a ambos | Reproducido |
| AC-8 | Baja | Precisión inconsistente: validación sin mínimo, redondeo a 9 decimales y texto a 4 | Reproducido |
| AC-9 | Baja | Un nombre de solo caracteres invisibles (U+200B) se acepta | Reproducido |

### AC-1 · Alta · Enter repetido ejecuta la acción dos veces

- **Síntoma.** En "Usé Huevos" con 6 huevos, escribir 1 y pulsar Enter dos veces seguidas deja **4**, no 5. En "Agregar", llenar el formulario y pulsar Enter dos veces crea **2 lotes** de Yogur. Sin ningún aviso al usuario. En "Usé" el dato guardado queda mal en silencio.
- **Causa raíz (investigada).** Al guardar con éxito, `Despensa.tsx` llama a `solicitarCierre()`, y `Hoja.tsx` mantiene montado el formulario durante la salida de 200 ms (`SALIDA_MS`). Lo único que bloquea la segunda acción es `pointer-events: none` en `.hoja[data-cerrando="true"]` (`src/index.css`), que frena el ratón y el toque pero no el teclado. `enviar` en `FormularioIngrediente.tsx` y `FormularioUso.tsx` no consulta ningún estado "ya enviado", y `useDespensa` aplica cada llamada sobre el estado ya actualizado (por eso el segundo descuento parte de 5 y llega a 4).
- **Pasos.** (1) Abrir la banda de Huevos, "Usé Huevos". (2) Escribir `1`. (3) Pulsar Enter dos veces rápido. (4) Ver `foodsaver:v1`: `seed-huevos` tiene `cantidad: 4`. Para "Agregar": llenar Yogur, 2, fecha futura y pulsar Enter dos veces: 11 registros en vez de 10.
- **No probado:** doble toque con el dedo. Por el análisis del flujo (React vuelve a pintar la hoja con `data-cerrando` antes del segundo clic) no debería repetirse, pero no se reprodujo.
- **Fix.** `Despensa.tsx`: un `cerrandoRef` se activa en `solicitarCierre()` y los cuatro manejadores (agregar, editar, usé, borrar) devuelven sin hacer nada si ya se pidió el cierre; el ref no depende del momento de repintado. `Hoja.tsx`: el panel lleva `inert` mientras `cerrando`, así el teclado tampoco llega al formulario.\n- **Test nuevo (falla sin el fix).** `scripts/e2e-fase5.mjs` sección AC-1: Enter doble en "Agregar" (esperado 1 lote), Enter doble en "Usé" (esperado 5) y hoja `inert` al cerrar. Antes del fix: 3 FALLA (2 lotes, quedan 4, sin `inert`).\n- **Re-prueba.** Con el fix: las 3 comprobaciones OK; `npm test` 397/397; `e2e-fase3` y `e2e-fase4` siguen en TODO OK (foco y cierre de la hoja intactos).

### AC-2 · Media · El singular o plural distinto no coincide con las recetas

- **Síntoma.** Con "Huevo" (6) y "Tomates" (4) en la despensa, "Huevos pericos gratinados con queso" pasa a parcial y dice "Te falta huevos: necesitas 3 unidades y no tienes" y "Te falta tomate…", aunque la persona sí los tiene. Es lo esperable con cualquier variante natural ("Frijol", "Limones", "Papas criollas"); solo se reprodujo con huevo y tomates.
- **Causa raíz (investigada).** `sugerirRecetas` y `cantidadDisponible` comparan `normalizarNombre(a) === normalizarNombre(b)`. La normalización solo quita mayúsculas, tildes y espacios (decisión del brief); no hay plurales ni sinónimos. Las recetas usan plural en `huevos`, `frijoles`, `garbanzos`, `lentejas`, `hongos` y singular en `tomate`, `cebolla`, `limón`. El formulario es texto libre sin sugerencias (`autoComplete="off"`), y el mensaje `no-hay` no distingue "no lo tienes" de "lo tienes con otro nombre".
- **Pasos.** (1) Dejar en la despensa "Huevo" y "Tomates". (2) Ir a Recetas. (3) Abrir "Huevos pericos": estado parcial con 4 faltantes.
- **Impacto en la demo:** si quien prueba agrega "Huevo" o "Tomates", el flujo principal (receta que aprovecha lo que vence) no aparece.
- **Fix / Re-prueba:** pendiente. Es una decisión de dominio (documentarla en CONTEXT.md): lista de sugerencias con los nombres de las recetas y/o plegado simple de plurales.

### AC-3 · Media · Dos pestañas se pisan

- **Síntoma.** Con la app abierta en dos pestañas, A agrega "DesdeA" y luego B (sin recargar) agrega "DesdeB": en `foodsaver:v1` queda solo `DesdeB`. A sigue mostrando 10 registros que ya no están guardados.
- **Causa raíz (investigada).** `useDespensa` copia el estado inicial una sola vez y, en cada acción, escribe la lista completa con `almacen.setItem`. No lee antes de escribir y no escucha el evento `storage` de `window`; gana la última escritura (R7 se cumple por pestaña, no entre pestañas).
- **Pasos.** Abrir `localhost:5173` en dos pestañas del mismo perfil, agregar un ingrediente distinto en cada una sin recargar y revisar `localStorage`.
- **Fix / Re-prueba:** pendiente.

### AC-4 · Media · Cierre sin protección con datos sin guardar

- **Síntoma.** Con "Agregar" a medio llenar, tocar el fondo (en 360 px el fondo ocupa toda la parte superior) o pulsar Escape cierra la hoja de inmediato y se pierde lo escrito, sin confirmación. Al volver a abrirla el formulario está vacío.
- **Causa raíz (investigada).** `onSolicitarCierre` es `setCerrando(true)` sin condiciones, y `Hoja.tsx` lo conecta a Escape, al clic del fondo (`hoja-fondo`) y a la X. Los formularios guardan sus valores en estado local propio y la hoja no sabe si hay cambios.
- **Pasos.** (1) Pulsar "Agregar". (2) Escribir nombre y cantidad. (3) Tocar el fondo oscuro o pulsar Escape. (4) La hoja cierra y los datos desaparecen.
- **Lo que sí funciona:** foco atrapado con Tab/Shift+Tab, Escape cierra, el foco vuelve al botón que abrió la hoja (cubierto por `e2e-fase3` y `e2e-fase4`, que pasan).
- **Fix / Re-prueba:** pendiente.

### AC-5 · Baja · Un registro inválido descarta todo

- **Síntoma.** Si en `foodsaver:v1` hay 3 ingredientes y uno tiene `cantidad: 100001`, la app muestra el seed de 9 registros más el aviso "Los datos guardados estaban dañados (Ingredientes con datos inválidos.)". Las Lentejas y el Aguacate válidos no aparecen y no hay forma de restaurarlos desde la interfaz.
- **Causa raíz (investigada).** `leerDespensa` en `persistencia.ts` exige `ingredientes.every(ingredienteValido)`; basta uno malo para devolver `corrupto`. `almacen.cargarDespensa` entonces sobrescribe `foodsaver:v1` con el seed y solo conserva el texto original en `foodsaver:v1:respaldo`, una única copia que se sobrescribe en cada nueva lectura corrupta (esto último es por lectura del código, no se reprodujo).
- **Por qué es Baja:** la app misma no puede producir un registro inválido (el formulario valida); solo ocurre con edición manual o si en el futuro se baja un límite.
- **Pasos.** Guardar en `localStorage` la clave con tres registros, uno con `cantidad: 100001`, y recargar.
- **Fix / Re-prueba:** pendiente. Opción: conservar los válidos y avisar de cuántos se descartaron.

### AC-6 · Baja · "1.000" y "1,000" se aceptan como 1

- **Síntoma.** Escribir `1.000` (mil, en la notación colombiana) guarda 1. Lo mismo con `1,000`. Se acepta sin aviso y la fila muestra "1 g".
- **Causa raíz (investigada).** La expresión `NUMERO` en `validacion.ts` (`^[+-]?(\d+([.,]\d+)?|[.,]\d+)$`) acepta un solo separador, punto o coma, y lo trata siempre como decimal. La decisión de F1 ("2,5" = 2.5) no consideró el punto como separador de miles.
- **Pasos.** Agregar un ingrediente con cantidad `1.000` y mirar el valor guardado.
- **Fix / Re-prueba:** pendiente. Decisión de dominio: rechazar con mensaje cuando haya exactamente tres dígitos tras el separador, o documentar que el punto es decimal.
- **Otras entradas probadas que se comportan bien:** `1.5.0`, `1e3`, `٣`, `0x10`, `5.`, `1 000`, `$5`, `2/3` se rechazan con mensaje claro; `+5`, ` 7 `, `.5` y `00012` se aceptan como 5, 7, 0,5 y 12 (razonable).

### AC-7 · Baja · Ids duplicados en el almacenamiento

- **Síntoma.** Con dos registros que comparten `id: "x"`, tocar la banda de "Aguacate" abre la hoja de **"Lentejas"** (comprobado en el navegador). En dominio, `eliminarIngrediente` con ese id borra los 2 y `actualizarIngrediente` renombra los 2.
- **Causa raíz (investigada).** `ingredienteValido` no comprueba unicidad de ids; `Despensa.tsx` resuelve la hoja con `ingredientes.find((x) => x.id === vista.id)` (el primero), y las operaciones de `despensa.ts` filtran/mapean todos los que coinciden.
- **Por qué es Baja:** la app genera ids con `crypto.randomUUID()`; solo ocurre con almacenamiento editado a mano.
- **Fix / Re-prueba:** pendiente.

### AC-8 · Baja · Precisión inconsistente entre validación, cálculo y texto

- **Síntoma.** `formatearCantidad(249.99999, 'g')` da "250 g" y un faltante de `0.00001` se escribe "faltan 0 g" (puede leerse "tienes 250 g; faltan 0 g"). `formatearCantidad(0.00004, 'g')` da "0 g". Con un lote de 4e-10 g, "usar" 3e-10 devuelve `eliminado: true` aunque queden 1e-10.
- **Causa raíz (investigada).** Tres precisiones distintas: `validarCantidad` acepta cualquier número > 0 (sin mínimo), `redondear` en `unidades.ts` trabaja a 9 decimales y `formatearNumero` en `presentacion.ts` redondea a 4.
- **Por qué es Baja:** requiere cantidades absurdas (el brief pide que 0.0001 se acepte, y funciona). No se probó con una receta real que pida exactamente 250 g; se mostró con las funciones de dominio.
- **Fix / Re-prueba:** pendiente.

### AC-9 · Baja · Nombre invisible aceptado

- **Síntoma.** `validarIngrediente` con nombre `"​"` (espacio de ancho cero) devuelve `ok: true`; la fila queda con un nombre que no se ve. Con `"  "` (espacio duro) sí se rechaza.
- **Causa raíz (investigada).** `String.prototype.trim` elimina espacios Unicode pero no U+200B (ni otros caracteres de formato).
- **Fix / Re-prueba:** pendiente.

### Información (sin severidad)

- Se acepta el año `0001`; el texto relativo dice "Hace 739000 días" sin separador de miles. Es coherente con "fecha pasada se acepta".
- `normalizarNombre` no pliega formas de ancho completo ni ligaduras (`ﬁ`). Irrelevante para el uso real.

### Lo que se probó y NO falló

- **Fechas.** Vence hoy = no vencido (el pollo del seed queda en "Usar primero"); calendario propio sin `Date` (31 de febrero, bisiestos, `sumarDias`). Con el reloj simulado, el cambio de día **sin recargar** mueve los ingredientes de "Usar primero" a "Ya vencieron" (+2 días: Pollo y Tomate vencidos; +3 días: también Huevos; resumen "1 por vencer · 5 vencidos"), "Huevos pericos" pasa a parcial, y a medianoche (23:59:30 → 00:00:30) el pollo pasa a vencido.
- **Lotes (caso 4).** Solo suman los vigentes (el lote de arroz vencido no entra); un ingrediente con solo lotes vencidos da el motivo `vencido`, no `no-hay`.
- **Unidades (caso 5).** g↔kg y ml↔l correctos (`1.1 kg → 1100 g`, `100000 l → 100000000 ml`); g/unidad no se convierten. Revisión de las 22 recetas: todas usan unidades válidas y cada ingrediente aparece siempre con una sola unidad (por ejemplo `arroz` y `harina de maíz` solo en g, `leche` solo en ml), sin choques de familia con el seed.
- **Ranking.** Desempate correcto (cocinables, urgencia, menos faltantes, nombre); tras la parte A el orden es Pericos, Pollo en costra, Tacos de arepa, Arroz meloso, Buñuelos.
- **localStorage (caso 8).** 13 contenidos inválidos (no JSON, `null`, número, cadena, arreglo viejo, versión 0 y 2, sin `ingredientes`, `ingredientes: null`, cantidad como texto, 31 de febrero, unidad desconocida): siempre vuelve al seed, con aviso, con respaldo y sin errores de JavaScript. Lista vacía válida: muestra el estado vacío sin aviso. Un nombre con HTML se muestra como texto (React lo escapa).
- **Cantidades (caso 1), nombres y fechas (casos 2 y 3):** cubiertos por la suite existente y confirmados en el navegador.

### Tests que faltan (propuestos; no se agregaron para dejar este commit solo con VERIFICATION.md)

| Test propuesto | Archivo | Hallazgo | Hoy |
|---|---|---|---|
| Un segundo envío durante la salida de la hoja no repite la acción (Enter dos veces en "Usé" y "Agregar") | e2e (Playwright) | AC-1 | falla |
| `usarIngrediente` aplicado dos veces con la misma intención no descuenta doble (si se hace idempotente por envío) | `despensa.test.ts` / e2e | AC-1 | falla |
| "Huevo" y "Tomates" cuentan para huevos/tomate; el mensaje distingue "lo tienes con otro nombre" | `recetas.test.ts`, `nombres` | AC-2 | falla |
| Un cambio en `localStorage` desde otra pestaña (evento `storage`) se refleja y no se pierde | e2e con dos páginas | AC-3 | falla |
| Cerrar con campos modificados pide confirmación; cerrar sin cambios no | e2e | AC-4 | falla |
| `leerDespensa` conserva los registros válidos y cuenta los descartados | `persistencia.test.ts` | AC-5 | falla |
| `validarCantidad("1.000")` según la decisión que se tome (rechazo o documentación) | `validacion.test.ts` | AC-6 | decisión |
| `leerDespensa` rechaza ids duplicados | `persistencia.test.ts` | AC-7 | falla |
| `describirFaltante` nunca escribe "faltan 0"; `usarIngrediente` no elimina con resto > 0 | `presentacion.test.ts`, `despensa.test.ts` | AC-8 | falla |
| `validarIngrediente` rechaza `"​"` y otros caracteres invisibles | `validacion.test.ts` | AC-9 | falla |
| Regresión de lo que sí funciona: cambio de día sin recargar y medianoche exacta | e2e | caso 9 | pasa (hoy solo se prueba cambiando `hoy`) |
