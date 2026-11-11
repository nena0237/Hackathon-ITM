# Food Saver 🥗

Aplicación web para aprovechar los ingredientes antes de que venzan: registras lo que tienes en casa, la app te muestra primero lo que vence antes (los vencidos van aparte) y te sugiere recetas que usan lo que está por vencer, indicando qué ingredientes te faltan.

Todo funciona en el navegador y los datos se guardan en `localStorage` (no hay servidor, login ni IA).

## Instalar y ejecutar (3 pasos)

```bash
npm install      # 1. instala dependencias
npm run dev      # 2. arranca en http://localhost:5173
npm test         # 3. (opcional) corre las pruebas
```

Otros comandos: `npm run build` (compila para producción) y `npm run preview` (sirve la compilación).

Al abrir por primera vez se cargan **datos de ejemplo** con fechas relativas a hoy. Demo sugerida: en *Recetas*, "Huevos pericos" aprovecha el tomate (vence mañana) y los huevos (en 2 días); "Arroz con leche" no se puede cocinar porque la leche está vencida.

## Requisito → dónde está en la app

| Req. | Qué pide | Dónde está en la app | Código |
|---|---|---|---|
| **R1** | Agregar y actualizar ingredientes (nombre, cantidad, unidad, vencimiento) | Pestaña **Despensa**: botón **+ Agregar** (arriba a la derecha) y, en cada ingrediente, el botón **Editar**. Un nombre repetido se guarda como otro lote. Extra: botón **Usé** (descuenta cantidad; si llega a 0 el lote se elimina) y **Borrar** con confirmación dentro de la app. | `src/components/FormularioIngrediente.tsx`, `src/pages/Despensa.tsx`, `agregarValidado` / `editarValidado` / `usarIngrediente` en `src/domain/despensa.ts` |
| **R2** | Ordenar por fecha de vencimiento | Pestaña **Despensa**, sección **En tu despensa**: lo que vence antes aparece primero; "por vencer" (0 a 3 días) va resaltado con ⏰ y texto. | `ordenarPorVencimiento`, `separarVencidos` en `src/domain/despensa.ts` |
| **R3** | Rechazar cantidades inválidas con mensaje claro | Formularios **Agregar**, **Editar** y **Usé**: el error aparece en español debajo del campo (vacía, 0, negativa, texto, Infinity, mayor que 100000). Se acepta la coma decimal ("2,5"). En **Usé** tampoco deja descontar más de lo que hay. | `validarCantidad`, `validarIngrediente` en `src/domain/validacion.ts` |
| **R4** | Vencidos por separado y fuera de las sugerencias | Pestaña **Despensa**, sección roja **Vencidos** (con la nota "No se usan en las sugerencias"). En **Recetas** un lote vencido nunca cuenta: la receta lo muestra como faltante ("Lo que tienes de leche está vencido…"). | `separarVencidos`, `esVencido` en `src/domain/`; `sugerirRecetas` en `src/domain/recetas.ts` |
| **R5** | Sugerir recetas con los ingredientes disponibles | Pestaña **Recetas**, sección **Puedes cocinar ahora**, ordenadas por urgencia: cada una indica "⏰ Aprovecha lo que está por vencer" con los ingredientes y los días. | `sugerirRecetas` en `src/domain/recetas.ts`, `src/pages/Recetas.tsx`, `src/components/TarjetaReceta.tsx` |
| **R6** | Identificar los ingredientes faltantes | Pestaña **Recetas**, sección **Te faltan ingredientes**: cada tarjeta lista **Qué te falta** con cantidad y motivo (no tienes, no alcanza, vencido o unidad incompatible). | `Faltante` / `describirFaltante` en `src/domain/` |
| **R7** | Los datos persisten al recargar | Automático en cada cambio (agregar, editar, usé, borrar): se guarda en `localStorage`, clave `foodsaver:v1`. Si los datos están dañados la app avisa, carga los ejemplos y guarda una copia. Si borras todo, la despensa queda vacía (con el botón **Cargar datos de ejemplo**). | `src/storage/almacen.ts`, `src/domain/persistencia.ts`, `src/hooks/useDespensa.ts` |
| **R8** | Colección de recetas predefinida | Pestaña **Recetas**: 12 recetas caseras colombianas; **Ver ingredientes y preparación** despliega ingredientes e instrucciones. | `src/data/recetas.ts` |

## Pruebas

- `npm test`: pruebas de la lógica (`src/domain`), de los datos de ejemplo (`src/data`) y del almacenamiento (`src/storage`).
- Pruebas de navegador con la interfaz real: ver `VERIFICATION.md` (se instalan aparte, no son dependencias del proyecto).

## Estructura

```
src/domain/    lógica pura (fechas, unidades, validación, despensa, recetas, persistencia) + tests
src/data/      seed.ts (ejemplo con fechas relativas) y recetas.ts
src/storage/   localStorage (clave foodsaver:v1) y reloj
src/hooks/     estado de la despensa y fecha de hoy
src/pages/     Despensa y Recetas
src/components/ piezas de interfaz
scripts/       pruebas de navegador (Playwright, opcionales)
```

Documentos del proceso: `CONTEXT.md`, `PLAN.md`, `VERIFICATION.md`.
