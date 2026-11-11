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
- [ ] **T5 — `src/data/seed.ts` con fechas relativas a hoy y `src/data/recetas.ts` con 12 recetas.** Hecho cuando: un test cuenta ≥3 cocinables y ≥2 parciales con 1 faltante con el seed, e incluye una receta que depende de la leche vencida. _R5, R8._
- [ ] **T6 — Storage `foodsaver:v1`.** Hecho cuando: sin datos carga el seed; con datos corruptos no se rompe y avisa; recargar conserva todo. _R7._
- [ ] **T7 — Pantalla Despensa.** Hecho cuando: lista ordenada, por vencer resaltado, vencidos en sección aparte (probado en navegador). _R2, R4._
- [ ] **T8 — Pantalla Recetas.** Hecho cuando: cocinables primero, parciales con faltantes, muestra qué ingredientes por vencer aprovecha; "Huevos pericos" aprovecha tomate y huevos; "Arroz con leche" no es cocinable. _R5, R6, R8._

### Resto de requisitos (Fase 3)
- [ ] **T9 — Formulario agregar/editar con errores bajo cada campo.** Hecho cuando: cantidad 0, negativa, texto, vacía y 1e9 muestran mensaje en español sin `alert`. _R1, R3._
- [ ] **T10 — Borrar con confirmación, acción "usé", estado vacío con "cargar datos de ejemplo".** Hecho cuando: cada acción persiste al recargar. _R1, R7._
- [ ] **T11 — README con tabla requisito → dónde está en la app.** Hecho cuando: R1 a R8 tienen fila con ubicación real. _R1–R8._

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
