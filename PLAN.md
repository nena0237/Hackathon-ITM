# PLAN.md — Food Saver

## Tareas

Orden: esqueleto → dominio con tests → flujo principal con seed → resto de requisitos → UX → despliegue.
Marca `[x]` = cerrada y verificada. Fase 1 = T1 a T4; el resto queda pendiente.

### Esqueleto
- [x] **T1 — Proyecto Vite + React + TS + Tailwind + Vitest.** Hecho cuando: `npm run dev` responde HTTP 200, `npm test` y `npm run build` terminan sin error. _Cubre: base de R7/R8 (despliegue y stack)._

### Dominio con tests (`src/domain`, funciones puras, `hoy` como parámetro)
- [x] **T2 — Fechas, nombres, unidades y validación.** Funciones: `esFechaValida`, `diasParaVencer`, `esVencido`, `esPorVencer`, `normalizarNombre`, `convertirUnidad`, `validarCantidad`, `validarIngrediente`. Hecho cuando: tests de los grupos 1, 2, 3 y 5 pasan y un mutante de cada regla (`<`/`<=`, tope, coma decimal, tildes, ñ, factor kg) hace fallar algún test. _Cubre: R3, R1 (validación), base de R4._
- [x] **T3 — Despensa y lotes.** Funciones: `ordenarPorVencimiento`, `separarVencidos`, `cantidadDisponible`, `agregar/actualizar/eliminarIngrediente`. Hecho cuando: tests de los grupos 4, 9 y 10 pasan; no mutan la entrada. _Cubre: R1, R2, R4._
- [x] **T4 — Sugerencia de recetas.** `sugerirRecetas` (cocinable/parcial, faltantes con motivo y cuánto falta, ingredientes por vencer aprovechados, ranking). Hecho cuando: tests de los grupos 5, 6, 7 y 9 pasan con ranking exacto y los mutantes de ranking/vencidos/unidades fallan. _Cubre: R4, R5, R6._
- [x] **T4b — Lectura/escritura segura de datos guardados (pura, sin localStorage).** `serializarDespensa`, `leerDespensa`. Hecho cuando: tests de los grupos 8 y 10 pasan (corrupto, formato viejo, versión, ida y vuelta). _Cubre: base de R7._

### Flujo principal con seed (Fase 2)
- [x] **T5 — `src/data/seed.ts` con fechas relativas a hoy y `src/data/recetas.ts` con 12 recetas.** Hecho cuando: un test cuenta ≥3 cocinables y ≥2 parciales con 1 faltante con el seed, e incluye una receta que depende de la leche vencida. _R5, R8._
- [x] **T6 — Storage `foodsaver:v1`.** Hecho cuando: sin datos carga el seed; con datos corruptos no se rompe y avisa; recargar conserva todo. _R7._
- [x] **T7 — Pantalla Despensa.** Hecho cuando: lista ordenada, por vencer resaltado, vencidos en sección aparte (probado en navegador). _R2, R4._
- [x] **T8 — Pantalla Recetas.** Hecho cuando: cocinables primero, parciales con faltantes, muestra qué ingredientes por vencer aprovecha; "Huevos pericos" aprovecha tomate y huevos; "Arroz con leche" no es cocinable. _R5, R6, R8._

### Resto de requisitos (Fase 3)
- [x] **T9 — Formulario agregar/editar con errores bajo cada campo.** Hecho cuando: cantidad 0, negativa, texto, vacía y 1e9 muestran mensaje en español sin `alert`. _R1, R3._
- [x] **T10 — Borrar con confirmación, acción "usé", estado vacío con "cargar datos de ejemplo".** Hecho cuando: cada acción persiste al recargar. _R1, R7._
- [x] **T11 — README con tabla requisito → dónde está en la app.** Hecho cuando: R1 a R8 tienen fila con ubicación real. _R1–R8._

### UX (Fase 4)
- [ ] **T12 — Pulido mobile-first.** Hecho cuando: se ve bien a 360 px y en escritorio, color + texto por urgencia, contador "N por vencer", foco y etiquetas accesibles.

### Verificación y despliegue (Fases 5 y 6)
- [ ] **T13 — Auditoría cruzada y VERIFICATION.md.** Hecho cuando: hallazgos reales con causa raíz, fix y re-prueba, o constancia de que no hubo.
- [ ] **T14 — Despliegue en Vercel y corrida limpia.** Hecho cuando: `npm ci`, `npm test`, `npm run build`, `npm run preview` pasan desde cero y la URL funciona en el celular.

## Ajustes de instrucciones

Qué cambió respecto a las instrucciones y por qué.

1. **BRIEF.md no estaba en el repo** (estaba en `Downloads/BRIEF_FOODSAVER.md`): se copió como `BRIEF.md` (Fase 0).
2. **Adelanto de la Fase 0 → Fase 1:** por error se instalaron dependencias y se creó `src/domain/` vacío antes de recibir la Fase 1. Instrucción de la Fase 1: verificar qué existe antes de instalar. Se verificó (`package.json`, `node_modules/.bin/{vite,vitest,tsc}`) y se continuó sin reinstalar.
3. **Decisiones de dominio del usuario** (Fase 1) agregadas a `CONTEXT.md` y copias: `"2,5"` = 2.5; cantidad máxima 100000 (1e9 rechazado); `0.0001` aceptado; nombre máximo 60; fecha pasada aceptada; nombre repetido = otro lote.
4. **Grupos 8 y 10 cubiertos a nivel de dominio, no de navegador.** El brief los describe con localStorage y recarga real, pero la Fase 1 prohíbe storage y UI. Se agregó `persistencia.ts` (funciones puras `serializarDespensa`/`leerDespensa`) y operaciones puras `agregar/actualizar/eliminarIngrediente`, y se prueba el ciclo guardar → leer → editar → borrar. **Pendiente en Fase 2 (T6/T7):** probar la recarga real en el navegador con localStorage.
5. **Ambigüedades que resolví yo (no estaban en las decisiones del usuario):**
   - `"1e9"` escrito como texto se rechaza como "no es un número" (sin notación científica en texto); `1e9` como número se rechaza por exceder el máximo.
   - Fecha: se exige un `YYYY-MM-DD` real del calendario; `2026-3-5`, `15/03/2026` y con hora se rechazan. Un valor que no es texto → "fecha no válida".
   - Año bisiesto y calendario se calculan con aritmética propia (sin `Date`), para no depender de la zona horaria ni de `Date.now()`.
   - `normalizarNombre` conserva la **ñ** (piña ≠ pina); solo quita tildes de las demás letras.
   - Una receta se considera "aprovechando" un ingrediente por vencer solo si ese lote es vigente y de unidad compatible, aunque la cantidad no alcance (en una receta parcial también se muestra).
   - `diasParaVencer`/`esVencido` lanzan `RangeError` ante una fecha inválida; la validación y la lectura de datos guardados impiden que lleguen fechas inválidas al dominio.
   - Cada faltante lleva `motivo`: `no-hay`, `insuficiente`, `vencido` o `unidad-incompatible` (útil para el mensaje en la UI).
6. **Bugs encontrados por mis propios tests durante la Fase 1 (corregidos):**
   - `ordenarPorVencimiento` ordenaba al revés (comparador con `* -1` de más). Lo detectaron 3 tests; corregido en `despensa.ts`.
   - `validarIngrediente` decía "la fecha es obligatoria" ante un valor que no era texto (ej. el número 20260315); ahora dice "no es válida".
   - Un test mío tenía mal la aritmética (3652 → 3653 días en 10 años, por 3 bisiestos); el código estaba bien, se corrigió el test.
   - `normalizarNombre`: primero usé un marcador interno que podía confundirse con texto del usuario; se reemplazó por separar por `ñ`, sin marcadores.
7. **Verificación de los tests (prueba de mutación):** se rompió la lógica a propósito 25 veces (script temporal fuera del repo); los 25 mutantes hicieron fallar al menos un test.
8. **Correcciones previas de la Fase 2:** los 3 bugs de la Fase 1 se copiaron a `VERIFICATION.md` (Prueba = "detectado por tests propios (F1)") con síntoma, causa raíz, fix y re-prueba. Se hizo `git init` (rama `main`). `.gitignore` ya cubría `node_modules` y `dist`; `*.local` NO cubría `.claude/settings.local.json` (solo coincide con archivos que terminan en `.local`), así que se agregó la regla explícita y `.vitest`. Se verificó con `git status` que `.claude/settings.local.json` no entra al commit. Commit: "Fase 1".

### Fase 2 — ajustes y hallazgos
9. **Funciones nuevas en el dominio para que la UI no tenga lógica:** `sumarDias` (seed relativo a hoy sin `Date`), `estadoVencimiento`, y `presentacion.ts` (`formatearCantidad`, `describirVencimiento`, `describirFaltante`, `formatearFecha`, `capitalizar`). Todas con tests (`sumarDias` se compara contra un cálculo independiente con `Date.UTC` en ±800 días).
10. **Receta ajustada por el ranking, no el ranking por la receta:** el primer test de demo falló porque "Arroz con pollo" (usaba pollo que vence hoy + tomate) empataba en urgencia 2 con "Huevos pericos" y ganaba por orden alfabético. El dominio cumplía las reglas del brief; se quitó el tomate de "Arroz con pollo" (urgencia 1) para que la demo abra con Huevos pericos.
11. **Seed persistido en el primer arranque:** se guarda en `foodsaver:v1` al abrir por primera vez, para distinguir "nunca abrió la app" (→ seed) de "borró todo" (→ lista vacía guardada, no vuelve el seed). Las fechas del seed se calculan una vez, relativas a ese día.
12. **Datos corruptos:** se carga el seed, se muestra un aviso (con motivo) y se guarda una copia del texto original en `foodsaver:v1:respaldo` (no se pierde lo que había). La carga se hace una sola vez en `main.tsx`, fuera de React: con `StrictMode` un `useState(() => cargar())` correría dos veces y la segunda ya leería el seed sin aviso.
13. **`hoy` solo en la capa UI/storage:** `storage/reloj.ts` (`hoyLocal`) y el hook `useHoy`, que lo recalcula cada 30 s y al volver a la pestaña, así la app cambia de estado sola pasada la medianoche.
14. **Bugs encontrados al probar en el navegador (corregidos):**
    - `GET /favicon.ico` daba 404 y dejaba un error en consola → favicon SVG en línea en `index.html`.
    - "Harina De Maíz": la clase CSS `capitalize` pone mayúscula a cada palabra → se reemplazó por `capitalizar()` (solo la primera letra) y los nombres de la despensa se muestran como se escribieron. **El script de navegador no lo detectó** (lee texto del DOM, no el render); lo vi en la captura. Lección: las capturas se revisan a ojo.
    - "leche está vencido": error de género → mensaje sin concordancia: "Lo que tienes de leche está vencido…".
15. **Verificación en navegador real (Edge, Playwright fuera del repo):** 49 comprobaciones pasan (flujo de demo, orden, vencidos aparte, recarga, grupos 7, 8 y 10, cambio de día con reloj simulado, sin errores en consola). **Límite honesto del grupo 10:** los formularios de agregar/editar/borrar son de la Fase 3; en esta fase las tres operaciones se simularon modificando `localStorage` directamente y recargando. La prueba con la interfaz real queda para la Fase 3.

### Fase 3 — ajustes y decisiones
16. **Correcciones previas:** los scripts de navegador se movieron a `scripts/` (`e2e-fase2.mjs`, `e2e-fase3.mjs`) con URL y carpeta de capturas por parámetro, y se documentó en `VERIFICATION.md` cómo correrlos. `playwright-core` NO está en `package.json`: se instala con `npm install --no-save playwright-core` (se verificó que `package.json` y `package-lock.json` no cambian). `capturas/` se agregó a `.gitignore`. Incidente: al editar el script con un comando de shell, unas comillas invertidas se ejecutaron como comando (un `npm install` que falló sin efecto); se revisó con `git status` que no cambió nada.
17. **DECISIÓN "usé" llega a 0 → se ELIMINA el lote.** Razón: una cantidad 0 es inválida en el dominio (R3) y `leerDespensa` rechazaría ese registro al recargar (lo trataría como datos corruptos); un lote agotado tampoco debe seguir apareciendo ni sumar. Se probó en dominio (`operaciones.test.ts`) y en el navegador (el lote no vuelve tras recargar). "Usé" no se ofrece en los vencidos (para eso están Editar y Borrar).
18. **"Usé" descuenta en la unidad del lote** y acepta coma decimal; rechaza vacío, 0, negativo, texto, NaN, Infinity, más de 100000 y más de lo que hay (mensaje: "No puedes usar más de lo que tienes (tienes 6 unidades)"). El resultado se redondea para evitar ruido de flotantes (0,3 − 0,1 = 0,2 exacto).
19. **Lógica fuera de React:** `agregarValidado`, `editarValidado` y `usarIngrediente` están en `src/domain/despensa.ts`; el hook `useDespensa` solo llama al dominio y guarda; los formularios reciben callbacks y solo muestran errores. `cantidadATexto` (dominio) precarga la cantidad al editar sin perder decimales.
20. **Formulario:** campo de cantidad de tipo texto (no `type=number`) para poder aceptar "2,5" y mostrar nuestros mensajes; `noValidate` para que no salgan globos del navegador; el foco va al primer campo con error. Fecha con `type=date`.
21. **"Cargar datos de ejemplo"** solo se ofrece en el estado vacío (no sobrescribe datos existentes) y usa `crearSeed(hoy)` con el `hoy` actual del hook, no las fechas guardadas (verificado en el navegador avanzando el reloj 10 días).
22. **Pruebas:** 243 tests (+31 de operaciones). 61 comprobaciones de navegador en `e2e-fase3.mjs` y 49 en `e2e-fase2.mjs`. El script de la Fase 3 pasó a la primera, por eso se validó con 3 mutantes de la app (permitir descontar de más, no guardar, fechas fijas en "cargar ejemplo"): los 3 se detectaron. No se encontraron bugs nuevos de la app en esta fase.
23. **Pendiente conscientemente (Fase 4, sin pulir ahora):** el aviso de éxito desaparece solo a los 4 s; en 360 px el resumen parte "2 vencidos" en dos líneas; un nombre escrito en minúscula ("tomate") se muestra como se escribió.
