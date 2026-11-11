<food_saver_brief>

<como_usar_este_archivo>
Este archivo es el contexto base del reto **Food Saver** (hackathon Prompt & Solve). Ponlo en tu proyecto de Claude Y copia el mismo archivo a la raíz del repo como `BRIEF.md` para que los agentes de código (Antigravity y Claude Code) lo lean.

Flujo de trabajo, fase por fase:
1. Dile a tu Claude "Fase N". Te entrega el prompt de esa fase, listo para pegar en el agente de código.
2. Pegas el prompt en el agente. Cuando termine, pegas su reporte a tu Claude.
3. Tu Claude revisa el reporte contra el checkpoint de la fase. Si algo no cumple, da UNA instrucción correctiva corta (no se reinicia). Si cumple, avanza a la fase siguiente.
4. Nunca se salta una fase ni se pasa a la siguiente sin cerrar el checkpoint.
</como_usar_este_archivo>

<instrucciones_para_el_asistente>
Eres el copiloto de estrategia. NO escribes el código: entregas prompts para los agentes de código y revisas sus reportes.

Reglas:
- Cuando la usuaria diga "Fase N", entrega SOLO el prompt de esa fase (de <fases>), en un bloque de código, más 2 líneas: qué se espera al terminar y cómo saber si salió bien.
- Prompts cortos y densos. No repitas la rúbrica dentro del prompt.
- Cuando la usuaria pegue el reporte del agente: compáralo con el <checkpoint> de la fase. Di con honestidad qué cumple y qué no. Si hay fallos, da una instrucción correctiva corta y pide que el agente la registre en "Ajustes de instrucciones" de PLAN.md.
- Honestidad ante todo: si algo es débil, dilo. NO aceptes bugs inventados en VERIFICATION.md: deben ser reales (síntoma, causa raíz, fix, re-prueba). Si la auditoría no encontró nada, que lo registre así y agregue pruebas.
- Un solo CLI trabaja a la vez sobre el repo. Recomendación: Antigravity construye (F1 a F4), Claude Code audita (F5), luego quien prefieran para F6 a F8.
- La mitad de la nota es el proceso: CONTEXT.md, PLAN.md y VERIFICATION.md son parte del entregable. Recuérdalo si ves que se quieren saltar.
- Si el tiempo se acaba, aplica el orden de recorte de <recorte_si_falta_tiempo>.
- Idioma de la interfaz y de los documentos: español.
</instrucciones_para_el_asistente>

<rubrica>
Cada criterio: 0 = ausente, 1 = limitado, 2 = adecuado, 3 = sólido, 4 = excelente.

| Criterio | Peso | Aspecto evaluado |
|---|---|---|
| Demostración funcional | 20 % | El flujo principal funciona en vivo de principio a fin |
| Resolución del problema | 15 % | Cumple los requisitos del reto |
| Experiencia de usuario y acabado | 15 % | Interfaz intuitiva; maneja errores comunes de entrada |
| Descomposición de tareas | 15 % | Tareas manejables; ajustan sus instrucciones según sea necesario |
| Gestión del contexto | 15 % | Dan requisitos, archivos y restricciones relevantes al agente |
| Verificación y depuración | 20 % | Revisan lo generado, investigan problemas, validan correcciones |

Producto (demo + problema + UX) = 50 %. Proceso con el agente (descomposición + contexto + verificación) = 50 %.
</rubrica>

<contexto_para_agente>

<reto_literal>
Evento Prompt & Solve: Hackathon asistida por IA. Equipos desarrollan una aplicación funcional con agentes de programación con IA, demostrando capacidad de entregar resultados Y de supervisar críticamente el trabajo generado por IA.

Alcance común: aplicación funcional que conserve los datos al recargar la página. Se permiten datos de ejemplo y almacenamiento local. Inicio de sesión, integraciones externas y funciones de IA dentro de la aplicación son opcionales.

Reto 2. Food Saver: aprovechar los ingredientes antes de que venzan.
- Objetivo: ayudar a los hogares a priorizar el uso de ingredientes y elegir comidas que reduzcan el desperdicio de alimentos.
- Información requerida: nombre del ingrediente, cantidad, unidad y fecha de vencimiento; nombre de la receta, ingredientes necesarios e instrucciones breves de preparación.
- Funciones principales: agregar y actualizar ingredientes; ordenarlos por fecha de vencimiento; sugerir recetas con los ingredientes disponibles; identificar ingredientes faltantes.
- Reglas básicas: rechazar cantidades inválidas. Señalar los ingredientes vencidos por separado y excluirlos de las sugerencias de recetas. Se puede usar una pequeña colección predefinida de recetas.
- Demostración: registrar varios ingredientes con distintas fechas de vencimiento y encontrar una receta que aproveche uno próximo a vencer.
- Usar datos personales ficticios y priorizar el flujo requerido antes de agregar funciones adicionales.
</reto_literal>

<requisitos>
- R1: Agregar y actualizar ingredientes (nombre, cantidad, unidad, vencimiento).
- R2: Ordenar ingredientes por fecha de vencimiento.
- R3: Rechazar cantidades inválidas (vacía, 0, negativa, no numérica) con mensaje claro.
- R4: Mostrar los vencidos por separado y excluirlos de las sugerencias de recetas.
- R5: Sugerir recetas con los ingredientes disponibles.
- R6: Identificar los ingredientes faltantes de cada receta.
- R7: Los datos persisten al recargar la página.
- R8: Colección de recetas predefinida (nombre, ingredientes, instrucciones breves).
- Extra de producto (solo después del flujo principal): marcar un ingrediente como "usado" o reducir su cantidad.
</requisitos>

<stack>
- React + Vite + TypeScript + Tailwind CSS. Mobile-first, responsive.
- Persistencia en localStorage (clave versionada, ej. `foodsaver:v1`).
- Vitest para pruebas de la lógica.
- Lógica de negocio en funciones PURAS en `src/domain/` (sin React, sin localStorage, sin `Date.now()` interno: la fecha de hoy entra como parámetro). La UI solo llama a esas funciones.
- Sin backend, sin login, sin APIs externas ni IA en la app (dependencias frágiles en vivo).
- Despliegue: Vercel. App móvil opcional: Capacitor (Android) sobre el mismo código.
</stack>

<estructura_carpetas>
```
/
├─ BRIEF.md  CONTEXT.md  PLAN.md  VERIFICATION.md  DEMO.md  README.md
├─ GEMINI.md  CLAUDE.md  AGENTS.md          (copias de CONTEXT.md)
└─ src/
   ├─ domain/      tipos, validación, fechas, unidades, despensa, recetas (+ *.test.ts)
   ├─ data/        seed.ts (ingredientes de ejemplo), recetas.ts (colección)
   ├─ storage/     lectura/escritura de localStorage con validación
   ├─ components/  piezas de UI
   └─ pages/       Despensa, Recetas
```
</estructura_carpetas>

<reglas_de_dominio>
- Fechas: formato `YYYY-MM-DD`, comparadas SOLO por día en hora local (nunca con hora). Un ingrediente que vence HOY NO está vencido. Vencido = fecha < hoy. "Por vencer" = vence en 0 a 3 días.
- `hoy` siempre es un parámetro de las funciones (para poder probar cualquier fecha).
- Cantidad válida: número finito mayor que 0. Se rechaza vacío, 0, negativo, NaN, texto, Infinity. Nombre obligatorio (no solo espacios). Fecha obligatoria y válida.
- Nombres: se normalizan para comparar (minúsculas, sin tildes, sin espacios extra). "Tomate" = "tomate" = " TOMATE ".
- Lotes: el mismo ingrediente puede tener varios registros (lotes) con distinta fecha. La cantidad disponible de un ingrediente suma SOLO los lotes no vencidos.
- Unidades soportadas: `g`, `kg`, `ml`, `l`, `unidad`. Conversión solo g↔kg y ml↔l. Unidades incompatibles (ej. g vs ml, o g vs unidad) NO se convierten: cuenta como faltante.
- Sugerencia de recetas: cada receta se clasifica como `cocinable` (todos los ingredientes alcanzan, sin vencidos) o `parcial` (faltan algunos; se listan los faltantes y cuánto falta). Una receta NUNCA usa ingredientes vencidos.
- Ranking: primero las cocinables; dentro de cada grupo, orden por "urgencia aprovechada" (cuántos ingredientes que vencen en 3 días o menos usa la receta; más urgencia primero). Desempate: menos faltantes, luego nombre.
- Cada receta muestra qué ingredientes por vencer aprovecha.
- La colección: 12 recetas colombianas/caseras en español, con nombres de ingredientes en minúscula, mezcla de unidades, instrucciones de 2 a 4 líneas. Debe incluir: al menos 3 cocinables con el seed, al menos 2 parciales con 1 faltante, y una que dependa del ingrediente vencido del seed (para demostrar la exclusión).
  Nombres sugeridos: Huevos pericos, Arepas con queso, Arroz con huevo, Sopa de tomate, Omelette de queso, Arroz con pollo, Sudado de pollo, Ensalada de tomate y cebolla, Arroz con leche, Papas con queso, Huevos rancheros, Sándwich gratinado.
</reglas_de_dominio>

<datos_seed>
Los datos de ejemplo se cargan solo si no hay datos guardados, con fechas RELATIVAS a hoy (si fueran fijas, los vencidos se desactualizan y la demo se rompe).

| Ingrediente | Cantidad | Unidad | Vence |
|---|---|---|---|
| Leche | 1 | l | hoy − 1 (vencido) |
| Tomate | 4 | unidad | hoy + 1 |
| Huevos | 6 | unidad | hoy + 2 |
| Queso | 250 | g | hoy + 3 |
| Pollo | 500 | g | hoy (borde: NO vencido) |
| Cebolla | 2 | unidad | hoy + 7 |
| Arroz | 500 | g | hoy + 180 |
| Harina de maíz | 1 | kg | hoy + 120 |
| Arroz | 250 | g | hoy − 5 (lote vencido del mismo ingrediente) |

Demo objetivo: Huevos pericos aprovecha tomate (vence mañana) y huevos (en 2 días). Arroz con leche NO aparece como cocinable porque la leche está vencida.
</datos_seed>

<casos_de_prueba_hostiles>
Estos casos los debe cubrir la suite de pruebas (F1) y la auditoría (F5):
1. Cantidad: "", 0, -3, "abc", NaN, Infinity, 0.0001, 1e9, "2,5" (coma decimal).
2. Nombre: vacío, solo espacios, 200 caracteres, con tildes y mayúsculas, duplicado exacto.
3. Fecha: vacía, formato inválido, 31 de febrero, ayer, hoy, mañana, dentro de 10 años.
4. Mismo ingrediente en dos lotes (uno vencido, uno vigente): solo cuenta el vigente.
5. Unidades: 500 g vs receta pide 0.5 kg (alcanza); 500 g vs 1 kg (falta 0.5 kg); g vs unidad (incompatible); ml vs l.
6. Receta cuyo único ingrediente disponible está vencido: no es cocinable y el ingrediente cuenta como faltante.
7. Despensa vacía: la pantalla de recetas muestra todo como parcial con todo faltante, sin errores.
8. localStorage corrupto o con formato viejo: la app no se rompe; vuelve al seed o a vacío con aviso.
9. Cambio de día: el mismo dato cambia de estado (por vencer → vencido) al cambiar `hoy`.
10. Recarga de página después de agregar, editar y borrar: todo persiste.
</casos_de_prueba_hostiles>

<definicion_de_hecho>
- Un comando instala y corre (README de máximo 3 pasos).
- El flujo de demo funciona de principio a fin con los datos seed.
- Cada requisito R1 a R8 tiene su fila en la tabla requisito → dónde está en la app (README).
- Entradas inválidas muestran mensajes claros en español, sin pantallas rotas ni trazas.
- `npm test` pasa. `npm run build` pasa sin errores.
- CONTEXT.md, PLAN.md y VERIFICATION.md existen y están actualizados.
</definicion_de_hecho>

</contexto_para_agente>

<fases>

<fase id="F0" nombre="Contexto y andamiaje de proceso">
<objetivo>El agente entiende el reto y deja los documentos de proceso listos. Sin código todavía.</objetivo>
<rubrica_que_suma>Gestión del contexto (15 %), Descomposición (15 %)</rubrica_que_suma>
<prompt>
```
Eres mi agente de desarrollo. Lee BRIEF.md, solo la sección <contexto_para_agente>.
Todavía NO escribas código. Crea:
1. CONTEXT.md: objetivo, requisitos R1-R8, decisiones de dominio, stack y por qué, estructura de carpetas, definición de hecho. Cópialo como GEMINI.md, CLAUDE.md y AGENTS.md.
2. PLAN.md con dos secciones vacías: "Tareas" y "Ajustes de instrucciones" (qué cambió y por qué).
3. VERIFICATION.md con la tabla vacía: Prueba | Resultado | Bug | Causa raíz | Fix | Re-prueba.
Al final dime en 5 líneas cómo entendiste el reto y qué ambigüedad ves.
```
</prompt>
<checkpoint>Existen los 6 archivos. El resumen del agente menciona vencidos excluidos, lotes, unidades y persistencia. Si no los menciona, es señal de que no leyó bien el brief: corregir antes de seguir.</checkpoint>
</fase>

<fase id="F1" nombre="Plan de tareas, esqueleto y dominio con pruebas">
<objetivo>Proyecto que corre, plan de tareas pequeñas y TODA la lógica de negocio probada antes de tocar la interfaz.</objetivo>
<rubrica_que_suma>Descomposición (15 %), Verificación (20 %), Resolución (15 %)</rubrica_que_suma>
<prompt>
```
Fase 1. Haz en orden, cerrando cada paso:
1. Llena PLAN.md con tareas T1..Tn: checkbox, criterio de hecho verificable y requisito que cubren. Orden: esqueleto → dominio con tests → flujo principal con seed → resto de requisitos → UX → despliegue.
2. Esqueleto: Vite + React + TS + Tailwind + Vitest. Debe correr con `npm run dev`.
3. src/domain, funciones puras con `hoy` como parámetro: normalizarNombre, validarIngrediente, esVencido, diasParaVencer, ordenarPorVencimiento, separarVencidos, convertirUnidad, cantidadDisponible (suma lotes vigentes), sugerirRecetas (cocinables y parciales con faltantes, ranking por urgencia aprovechada).
4. Tests para TODOS los casos de <casos_de_prueba_hostiles> del BRIEF.
5. Ejecuta `npm test`. Registra en PLAN.md cada tarea cerrada y cualquier ajuste que hayas hecho a mis instrucciones.
Reporte: tareas cerradas, tests pasando, dudas.
```
</prompt>
<checkpoint>`npm test` pasa y cubre los 10 grupos de casos hostiles. PLAN.md tiene tareas con criterio de hecho. Pide que muestre el output de los tests, no solo que diga que pasan.</checkpoint>
</fase>

<fase id="F2" nombre="Flujo principal de punta a punta">
<objetivo>La demo del reto funcionando con datos seed: despensa ordenada, vencidos aparte, receta sugerida y faltantes.</objetivo>
<rubrica_que_suma>Demostración funcional (20 %), Resolución (15 %)</rubrica_que_suma>
<prompt>
```
Fase 2. Construye el flujo principal sobre src/domain, sin duplicar lógica en la UI:
- src/data/seed.ts con fechas relativas a hoy (tabla de <datos_seed>) y src/data/recetas.ts con las 12 recetas.
- Storage: guardar en localStorage `foodsaver:v1`; si no hay datos, cargar seed; si está corrupto, no romper.
- Pantalla Despensa: lista ordenada por vencimiento, "por vencer" resaltado, vencidos en sección aparte.
- Pantalla Recetas: cocinables primero, luego parciales con faltantes; cada una muestra qué ingredientes por vencer aprovecha.
Prueba el flujo de demo completo en el navegador y corrige. Marca tareas en PLAN.md y anota ajustes.
Reporte: qué se ve, qué falló y corregiste.
```
</prompt>
<checkpoint>Se puede hacer la demo completa: se ven los vencidos separados, Huevos pericos aparece como cocinable aprovechando tomate y huevos, y Arroz con leche NO aparece como cocinable. Recargar la página conserva todo.</checkpoint>
</fase>

<fase id="F3" nombre="Resto de requisitos y validación">
<objetivo>Agregar, editar, borrar y usar ingredientes con validación y mensajes claros. Todos los requisitos cubiertos.</objetivo>
<rubrica_que_suma>Resolución (15 %), UX (15 %)</rubrica_que_suma>
<prompt>
```
Fase 3. Completa R1-R8:
- Formulario para agregar y editar ingrediente (nombre, cantidad, unidad, fecha). Usa validarIngrediente; errores en español debajo de cada campo, sin alertas del navegador.
- Borrar con confirmación. Acción "usé" que descuenta cantidad (si llega a 0, se elimina o se marca usado; decide y regístralo).
- Estado vacío con mensaje útil y botón "cargar datos de ejemplo".
- Todo persiste al recargar.
Agrega al README la tabla requisito → dónde está en la app. Actualiza PLAN.md.
Reporte: tabla R1-R8 con su estado.
```
</prompt>
<checkpoint>Cada R1 a R8 tiene una fila con ubicación real en la app. Probar a mano: cantidad 0, negativa y texto muestran error claro; editar y recargar persiste.</checkpoint>
</fase>

<fase id="F4" nombre="Pulido de UX mobile-first">
<objetivo>Interfaz que se entienda sin explicación, bonita en celular y escritorio.</objetivo>
<rubrica_que_suma>UX y acabado (15 %), Demostración (20 %)</rubrica_que_suma>
<prompt>
```
Fase 4. Revisa la app como usuario nuevo y pule, sin romper la lógica:
- Mobile-first (probar a 360 px y a escritorio), botones táctiles grandes, navegación simple entre Despensa y Recetas.
- Color e ícono por urgencia (vencido, hoy/por vencer, vigente), con texto además del color. Contador "N por vencer".
- Estados de vacío, mensajes de confirmación al guardar, foco correcto en formularios, etiquetas accesibles.
- Textos 100 % en español, consistentes. Diseño limpio y coherente (tipografía, espaciado, colores).
Corre `npm test` y `npm run build`. Anota en PLAN.md lo que cambiaste.
Reporte: antes/después de lo más importante.
```
</prompt>
<checkpoint>Pide capturas o descripción a 360 px. Revisar tú misma en el celular: ¿se entiende en 10 segundos qué usar primero? Si no, una instrucción correctiva corta.</checkpoint>
</fase>

<fase id="F5" nombre="Verificación cruzada (la fase más importante)">
<objetivo>Un agente DISTINTO al que construyó audita la app y se documentan bugs reales con causa raíz y re-prueba.</objetivo>
<rubrica_que_suma>Verificación y depuración (20 %), Descomposición (15 %)</rubrica_que_suma>
<instruccion_previa>Cambia de CLI: si construyó Antigravity, audita Claude Code (o al revés). El auditor no debe haber visto el razonamiento del constructor. Haz commit antes de empezar.</instruccion_previa>
<prompt_auditor>
```
Eres auditor independiente. No asumas que lo generado funciona. Lee CONTEXT.md y BRIEF.md.
1. Ejecuta `npm test` y `npm run build`. Revisa src/domain buscando errores de lógica (fechas, lotes, unidades, redondeo, ranking).
2. Prueba la app con <casos_de_prueba_hostiles> y con entradas inesperadas (campos vacíos, textos largos, duplicados, localStorage corrupto, recargas, cambio de día).
3. Por cada hallazgo, en VERIFICATION.md: síntoma → causa raíz (investigada, no adivinada) → severidad. NO inventes bugs: si no hay, dilo y agrega los tests que faltan.
No corrijas todavía. Dame la lista priorizada.
```
</prompt_auditor>
<prompt_correccion>
```
Corrige los hallazgos de VERIFICATION.md uno por uno, de mayor a menor severidad. Por cada uno: fix → escribe un test que falle sin el fix → re-prueba y registra el resultado en VERIFICATION.md. No cierres un bug sin re-prueba. Al final corre todo `npm test` y `npm run build`.
```
</prompt_correccion>
<checkpoint>VERIFICATION.md tiene hallazgos reales con las 4 columnas llenas (síntoma, causa raíz, fix, re-prueba) y tests nuevos. Si el auditor no halló nada, es sospechoso: pídele probar de nuevo los casos 4, 5 y 9.</checkpoint>
</fase>

<fase id="F6" nombre="Despliegue y corrida limpia">
<objetivo>URL pública funcionando en el celular y proyecto que arranca desde cero con un comando.</objetivo>
<rubrica_que_suma>Demostración (20 %), Gestión del contexto (15 %)</rubrica_que_suma>
<prompt>
```
Fase 6. Prepara el despliegue:
- README: título, qué hace, instalación y ejecución en máximo 3 pasos, tabla requisito → app, cómo correr tests, URL desplegada (placeholder).
- Verifica desde cero: borra node_modules y dist, `npm ci`, `npm test`, `npm run build`, `npm run preview`. Corrige lo que falle.
- Confirma que no hay secretos ni rutas locales en el repo y que .gitignore es correcto.
Reporte: salida de cada comando.
```
</prompt>
<pasos_manuales>
1. Subir el repo a GitHub.
2. En Vercel: Add New Project → importar el repo → framework Vite (detecta solo) → Deploy.
3. Abrir la URL en el celular, recargar y comprobar la demo completa.
4. Pegar la URL en el README.
</pasos_manuales>
<checkpoint>La URL carga en el celular, el flujo de demo funciona y recargar conserva los datos. La corrida limpia pasó.</checkpoint>
</fase>

<fase id="F7" nombre="App Android con Capacitor (OPCIONAL, solo si F0 a F6 están cerradas)">
<objetivo>Generar un APK del mismo código web y abrirlo en el emulador o en un teléfono.</objetivo>
<rubrica_que_suma>Extra de diferenciación. No suma directo en la rúbrica, por eso va al final y nunca bloquea nada.</rubrica_que_suma>
<prompt>
```
Fase 7 (opcional). Envuelve la app con Capacitor para Android sin tocar src/domain:
- Instala @capacitor/core, @capacitor/cli, @capacitor/android. `npx cap init "Food Saver" com.foodsaver.app --web-dir=dist`.
- `npm run build`, `npx cap add android`, `npx cap sync`.
- Añade scripts en package.json: "android:sync" (build + sync) y "android:open" (cap open android).
- Verifica que localStorage persiste en el WebView, y revisa viewport, íconos y nombre de la app.
- Documenta los pasos en README (sección "App Android").
Dime qué debo hacer yo en Android Studio.
```
</prompt>
<pasos_manuales>
1. `npm run android:sync` y luego `npm run android:open` (abre Android Studio).
2. Esperar a que termine el Gradle sync (necesita JDK 17 o superior, que Android Studio ya trae).
3. Ejecutar en un emulador o en un teléfono con depuración USB.
4. Para el APK: Build → Build Bundle(s) / APK(s) → Build APK(s).
5. Comprobar que al cerrar y abrir la app los datos siguen ahí.
</pasos_manuales>
<checkpoint>La app abre en el emulador o teléfono, la demo funciona y los datos persisten al cerrarla. Si en 30 minutos hay problemas de entorno, abandonar: la web desplegada es la demo principal.</checkpoint>
</fase>

<fase id="F8" nombre="Guion de demo y corrida final">
<objetivo>Demo ensayada, con plan B, y documentación final actualizada.</objetivo>
<rubrica_que_suma>Demostración (20 %), todos los criterios de proceso</rubrica_que_suma>
<prompt>
```
Fase 8. Cierra el proyecto:
1. DEMO.md: guion de 3 a 5 minutos. Pasos exactos, datos a usar, qué decir en cada paso. Debe mostrar: despensa ordenada, vencidos aparte, agregar un ingrediente con error de cantidad (mensaje) y luego válido, receta que aprovecha lo que vence, faltantes. Incluye una explicación breve de cómo supervisamos al agente (tests, auditoría cruzada, bugs corregidos). Incluye plan B: URL desplegada, APK, o correr local, más capturas.
2. Corrida final desde cero (instalación limpia + un comando) y confirma que funciona.
3. Actualiza CONTEXT.md y PLAN.md con el estado final, y revisa que VERIFICATION.md esté completo.
4. Pasa la <definicion_de_hecho> del BRIEF punto por punto.
Reporte corto: qué funciona, qué falló y se corrigió, riesgos que quedan.
```
</prompt>
<checkpoint>Ensayan la demo completa una vez, cronometrada. Pasan el checklist final.</checkpoint>
</fase>

</fases>

<instrucciones_correctivas>
Si un agente se desvía o falla, NO reiniciar. Dar una instrucción corta y exigir que la registre en PLAN.md ("Ajustes de instrucciones") o VERIFICATION.md. Esos ajustes visibles suman en Descomposición y Verificación. Ejemplos:
- "Moviste lógica de fechas a un componente. Devuélvela a src/domain y cubre con un test. Registra el ajuste."
- "Inventaste librerías o rutas que no existen. Verifica el import real antes de seguir. Registra qué pasó."
- "El test pasa pero no prueba lo que dice. Reescríbelo para que falle sin el fix."
- "No pases a la siguiente tarea hasta que `npm test` y `npm run build` pasen."
</instrucciones_correctivas>

<mapeo_a_rubrica>
| Criterio | Dónde se gana el 4 |
|---|---|
| Demostración funcional (20 %) | F2 flujo con seed relativo a hoy; F6 URL en el celular; F8 guion ensayado con plan B |
| Resolución del problema (15 %) | F3 tabla R1 a R8 → dónde está en la app, en el README |
| UX y acabado (15 %) | F3 validaciones y mensajes en español; F4 mobile-first, estados vacíos, color más texto |
| Descomposición (15 %) | F1 PLAN.md con tareas y criterio de hecho; "Ajustes de instrucciones" reales |
| Gestión del contexto (15 %) | F0 CONTEXT.md copiado como GEMINI.md, CLAUDE.md y AGENTS.md; BRIEF.md en el repo |
| Verificación y depuración (20 %) | F1 tests de casos hostiles; F5 auditoría cruzada con bugs reales, causa raíz y re-prueba |
</mapeo_a_rubrica>

<recorte_si_falta_tiempo>
Recortar en este orden y nunca más allá:
1. F7 (APK).
2. Acción "usé" y pulido fino de F4.
3. Edición avanzada de F3 (se conserva agregar, listar y validar).
No se recortan: F0, F1, F2, F5 y el guion de F8. Ahí está el 70 % de la nota.
</recorte_si_falta_tiempo>

<checklist_antes_de_presentar>
- [ ] El flujo principal corre en vivo de principio a fin
- [ ] Cada R1 a R8 tiene su fila en la tabla requisito → app
- [ ] Entradas inválidas muestran mensajes claros, no pantallas rotas
- [ ] CONTEXT.md, PLAN.md y VERIFICATION.md existen y están actualizados
- [ ] PLAN.md tiene al menos un ajuste de instrucciones real
- [ ] VERIFICATION.md tiene bugs reales con causa raíz y re-prueba
- [ ] `npm test` y `npm run build` pasan
- [ ] Corrida limpia desde cero hecha minutos antes de presentar
- [ ] URL desplegada abierta en el celular y probada
- [ ] Plan B de demo listo (APK, capturas, ejecución local)
</checklist_antes_de_presentar>

</food_saver_brief>
