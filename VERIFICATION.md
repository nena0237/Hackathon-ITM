# VERIFICATION.md

Registro de bugs reales: síntoma, causa raíz investigada, fix y re-prueba. Las filas "detectado por tests propios" salieron de la suite del propio constructor durante la Fase 1; la auditoría cruzada independiente (Fase 5) se agrega debajo.

| Prueba | Resultado | Bug | Causa raíz | Fix | Re-prueba |
|---|---|---|---|---|---|
| detectado por tests propios (F1) — `despensa.test.ts`: "ordena de la fecha más cercana a la más lejana", "compara fechas como fechas (cruce de año)", "cada grupo queda ordenado por vencimiento" | 3 tests fallaron: se esperaba `['Leche','Pollo','Tomate','Arroz']` y se obtuvo `['Arroz','Tomate','Pollo','Leche']` | `ordenarPorVencimiento` ordenaba al revés (de la fecha más lejana a la más cercana); `separarVencidos` heredaba el error (vencidos del más reciente al más antiguo) | En `src/domain/despensa.ts` el comparador era `diasParaVencer(a.vence, b.vence) * -1`. `diasParaVencer(a, b)` ya devuelve `a − b` (positivo si `a` vence después), que es justo el signo de un orden ascendente; el `* -1` de más lo invertía. | Se quitó el `* -1`: el comparador es `diasParaVencer(a.vence, b.vence) \|\| comparación por nombre`. | `npm test`: los 3 tests pasan (168/168). Además, un mutante que invierte el desempate por nombre ("desempate por nombre invertido") sigue haciendo fallar un test. |
| detectado por tests propios (F1) — `validacion.test.ts`: "formato inválido 20260315 → mensaje de fecha no válida" | 1 test falló: con la fecha como número `20260315` el mensaje fue "La fecha de vencimiento es obligatoria." en vez de "La fecha no es válida…" | Orden/ramas de validación de fecha mal: un valor presente pero de tipo equivocado se trataba como "vacío" | En `src/domain/validacion.ts` la condición de "obligatoria" era `typeof entrada.vence !== 'string' \|\| entrada.vence.trim() === ''`, que mezclaba "ausente" con "no es texto". El chequeo "no es válida" nunca se alcanzaba para valores no-string. | La rama "obligatoria" ahora solo cubre `null`/`undefined`/texto en blanco: `entrada.vence == null \|\| (typeof entrada.vence === 'string' && entrada.vence.trim() === '')`. Todo lo demás pasa a `esFechaValida`. | `npm test`: el test pasa y los 6 valores de formato inválido (incluido el número) dan "no es válida"; los valores vacíos siguen dando "obligatoria". |
| detectado por tests propios (F1) — `validacion.test.ts`: "normalizarNombre no altera nombres con símbolos o números (sin marcadores internos)" y "conserva la ñ… precompuesta o descompuesta" (escritos al detectar el riesgo; el mutante "no quita tildes" no se había aplicado y reveló el problema) | La versión intermedia convertía un nombre como `Mix 0001 #1` en `mixñ…`: un texto del usuario se confundía con el marcador interno. Además, el regex de tildes tenía caracteres combinantes invisibles escritos literalmente | `normalizarNombre` protegía la ñ reemplazándola por un marcador de texto (`'#'`, luego `'0001'` tras un `sed` mío) para restaurarla después de `normalize('NFD')`. Cualquier nombre que contuviera el marcador se corrompía al restaurarse. | Se eliminó el marcador: se hace `normalize('NFC')`, se separa el texto por `ñ`, se quitan las marcas diacríticas (`\p{M}`) de cada parte y se vuelve a unir con `ñ`. | `npm test`: pasa el test de `Mix 0001 #1`, el de `piña` (ñ descompuesta → `piña`) y `Añejo ÁÉÍÓÚ` → `añejo aeiou`. Mutantes "no quita tildes" y "ñ se pierde" hacen fallar tests. |

## Pruebas de navegador (interfaz real)

Scripts en `scripts/`, hechos con Playwright sobre Edge/Chrome real. **No son parte del proyecto:** `playwright-core` NO está en `package.json` y hay que instalarlo aparte.

```bash
npm install --no-save playwright-core   # instala sin tocar package.json ni package-lock.json
npm run dev                             # en otra terminal (puerto 5173)
node scripts/e2e-fase2.mjs              # flujo de demo, orden, vencidos, recarga, corrupto, cambio de día (49 comprobaciones)
node scripts/e2e-fase3.mjs              # agregar/editar/usé/borrar con recarga, casos hostiles, estado vacío (61 comprobaciones)
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
