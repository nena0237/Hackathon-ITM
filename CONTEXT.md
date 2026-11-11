# CONTEXT.md — Food Saver

Fuente: `BRIEF.md` (sección `<contexto_para_agente>`). Este archivo es el contexto base para cualquier agente de código. Idioma de la interfaz y de los documentos: español.

## Objetivo

Reto 2 de Prompt & Solve: **aprovechar los ingredientes antes de que venzan**. La app ayuda a un hogar a priorizar qué ingredientes usar y a elegir comidas que reduzcan el desperdicio. Debe ser una aplicación funcional que **conserve los datos al recargar**. Se permiten datos de ejemplo y almacenamiento local; login, integraciones externas e IA dentro de la app son opcionales (aquí: no se usan). Se evalúan el producto (50 %) y el proceso con el agente (50 %): CONTEXT.md, PLAN.md y VERIFICATION.md son parte del entregable.

Demo objetivo: registrar varios ingredientes con distintas fechas y encontrar una receta que aproveche uno próximo a vencer. Con el seed, "Huevos pericos" aprovecha tomate (vence mañana) y huevos (en 2 días); "Arroz con leche" NO aparece como cocinable porque la leche está vencida.

## Requisitos

- **R1** Agregar y actualizar ingredientes (nombre, cantidad, unidad, vencimiento).
- **R2** Ordenar ingredientes por fecha de vencimiento.
- **R3** Rechazar cantidades inválidas (vacía, 0, negativa, no numérica) con mensaje claro.
- **R4** Mostrar los vencidos por separado y excluirlos de las sugerencias de recetas.
- **R5** Sugerir recetas con los ingredientes disponibles.
- **R6** Identificar los ingredientes faltantes de cada receta.
- **R7** Los datos persisten al recargar la página.
- **R8** Colección de recetas predefinida (nombre, ingredientes, instrucciones breves).
- Extra (solo tras el flujo principal): marcar un ingrediente como "usado" o reducir su cantidad.

## Decisiones de dominio

- **Fechas**: `YYYY-MM-DD`, comparadas solo por día en hora local. Vence HOY = NO vencido. Vencido = fecha < hoy. "Por vencer" = vence en 0 a 3 días. `hoy` siempre es parámetro de las funciones (nunca `Date.now()` dentro del dominio).
- **Cantidad válida**: número finito > 0. Se rechaza vacío, 0, negativo, NaN, texto e Infinity. Nombre obligatorio (no solo espacios). Fecha obligatoria y válida.
- **Nombres**: se normalizan para comparar (minúsculas, sin tildes, sin espacios extra): "Tomate" = "tomate" = " TOMATE ".
- **Lotes**: el mismo ingrediente puede tener varios registros con distinta fecha. La cantidad disponible suma SOLO los lotes no vencidos.
- **Unidades**: `g`, `kg`, `ml`, `l`, `unidad`. Solo se convierte g↔kg y ml↔l. Unidades incompatibles (g vs ml, g vs unidad) no se convierten: cuentan como faltante.
- **Sugerencias**: cada receta es `cocinable` (todo alcanza, sin vencidos) o `parcial` (se listan faltantes y cuánto falta). Una receta NUNCA usa ingredientes vencidos.
- **Ranking**: cocinables primero; dentro de cada grupo, más "urgencia aprovechada" (ingredientes que vencen en ≤3 días y que usa la receta); desempate por menos faltantes y luego nombre. Cada receta muestra qué ingredientes por vencer aprovecha.
- **Recetas**: 12 recetas colombianas/caseras en español, ingredientes en minúscula, mezcla de unidades, instrucciones de 2 a 4 líneas. Con el seed: ≥3 cocinables, ≥2 parciales con 1 faltante, y una que dependa del ingrediente vencido (para demostrar la exclusión).
- **Decisiones que resuelven ambigüedades del brief (Fase 1)**:
  - Cantidad: se acepta `"2,5"` y se interpreta como 2.5. Se rechaza vacío, 0, negativo, NaN, texto e Infinity. **Máximo 100000**: `1e9` se rechaza con mensaje claro. `0.0001` se acepta.
  - Nombre: obligatorio, **máximo 60 caracteres**; 200 caracteres se rechazan con mensaje claro.
  - Fecha pasada: se acepta (sirve para registrar algo ya vencido); aparece en la sección de vencidos.
  - Nombre repetido: se guarda como **otro lote**; no se fusiona ni se rechaza.
- **Seed**: se carga solo si no hay datos guardados, con fechas RELATIVAS a hoy:

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
| Arroz | 250 | g | hoy − 5 (lote vencido) |

## Casos de prueba hostiles (los debe cubrir la suite)

1. Cantidad: "", 0, -3, "abc", NaN, Infinity, 0.0001, 1e9, "2,5".
2. Nombre: vacío, solo espacios, 200 caracteres, tildes y mayúsculas, duplicado exacto.
3. Fecha: vacía, formato inválido, 31 de febrero, ayer, hoy, mañana, dentro de 10 años.
4. Mismo ingrediente en dos lotes (uno vencido, uno vigente): solo cuenta el vigente.
5. Unidades: 500 g vs 0.5 kg (alcanza); 500 g vs 1 kg (falta 0.5 kg); g vs unidad (incompatible); ml vs l.
6. Receta cuyo único ingrediente disponible está vencido: no es cocinable y cuenta como faltante.
7. Despensa vacía: recetas todo parcial con todo faltante, sin errores.
8. localStorage corrupto o formato viejo: no se rompe; vuelve a seed o vacío con aviso.
9. Cambio de día: el mismo dato pasa de por vencer a vencido al cambiar `hoy`.
10. Recarga tras agregar, editar y borrar: todo persiste.

## Stack y por qué

- **React + Vite + TypeScript + Tailwind CSS**: arranque rápido, tipos que atrapan errores de dominio, UI mobile-first sin CSS a mano.
- **localStorage** con clave versionada `foodsaver:v1`: sin backend ni login, que serían dependencias frágiles en vivo.
- **Vitest**: pruebas rápidas de la lógica pura.
- **Lógica en funciones PURAS en `src/domain/`** (sin React, sin localStorage, sin `Date.now()`): se prueba cualquier fecha y la UI solo llama al dominio.
- Sin backend, sin login, sin APIs externas ni IA en la app. Despliegue en Vercel; Android opcional con Capacitor.

## Estructura de carpetas

```
/
├─ BRIEF.md  CONTEXT.md  PLAN.md  VERIFICATION.md  DEMO.md  README.md
├─ GEMINI.md  CLAUDE.md  AGENTS.md          (copias de CONTEXT.md)
└─ src/
   ├─ domain/      tipos, validación, fechas, unidades, despensa, recetas (+ *.test.ts)
   ├─ data/        seed.ts, recetas.ts
   ├─ storage/     lectura/escritura de localStorage con validación
   ├─ components/  piezas de UI
   └─ pages/       Despensa, Recetas
```

## Definición de hecho

- Un comando instala y corre (README de máximo 3 pasos).
- El flujo de demo funciona de principio a fin con el seed.
- Cada R1–R8 tiene su fila en la tabla requisito → dónde está en la app (README).
- Entradas inválidas muestran mensajes claros en español, sin pantallas rotas ni trazas.
- `npm test` y `npm run build` pasan sin errores.
- CONTEXT.md, PLAN.md y VERIFICATION.md existen y están actualizados.
