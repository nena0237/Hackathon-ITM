# DISENO.md — Food Saver: "Fruta + línea de tiempo"

Especificación visual de la Fase 4. Es solo visual: no cambia reglas de dominio ni el formato de `localStorage`. La lógica de formato vive en `src/domain/formato.ts` (funciones puras con tests).

## Idea

La despensa es una **línea de tiempo vertical** que baja de lo más urgente a lo menos urgente. Cada ingrediente es una banda de color a todo ancho, conectada a la línea por un nodo. Se entiende en 10 segundos qué usar primero.

## Paleta (tinta sobre cada color, nunca texto blanco)

| Token (Tailwind) | Valor | Uso |
|---|---|---|
| `crema` | `#FFF3DC` | fondo |
| `tinta` | `#1C1410` | texto principal, botones primarios, barra inferior |
| `tinta-suave` | `#6B5A48` | texto secundario, **solo sobre crema** |
| `coral` | `#FF6B4A` | vence hoy (0 días) |
| `coral-claro` | `#FF8F70` | vence mañana (1 día) |
| `mango` | `#FFC53D` | 2 días |
| `mango-claro` | `#FFD97A` | 3 días |
| `lima` | `#BFDC4A` | 4 días o más |
| `lima-claro` | `#CFE56E` | más de 30 días |
| `gris-a` / `gris-b` | `#D3C9B6` / `#C4B9A4` | vencido: rayado `repeating-linear-gradient(135deg, …)` |
| `aviso` | `#8E1F12` | texto de aviso y errores |

Cada estado lleva **color + ícono + texto**; el color nunca va solo.

| Estado | Ícono | Texto en la banda |
|---|---|---|
| Hoy | alerta (triángulo) | HOY |
| Mañana / 2 / 3 días | reloj | MAÑANA / 2 DÍAS / 3 DÍAS |
| 4 días o más | hoja con visto | N DÍAS |
| Vencido | X | HACE N DÍAS (nombre tachado) |

## Tipografía (empaquetada, sin CDN)

- Títulos: **Bricolage Grotesque** 800 (`@fontsource/bricolage-grotesque`), tracking −0.03em.
- Texto: **Instrument Sans** 400–600 (`@fontsource/instrument-sans`).
- Prohibido: Inter, Roboto, Arial.

## Anatomía de una fila de Despensa

- Columna izquierda de 50 px: fecha explícita (mes en mayúsculas pequeño y día en Bricolage 800; con año si no es el actual).
- Línea vertical continua de 4 px a su derecha; cada tramo toma el color de su banda (baja de coral a lima). En vencidos, punteada.
- Nodo circular de 16 px sobre la línea, del color de la banda, con aro de tinta de 2 px. "Hoy" lleva un anillo que pulsa suave; vencidos llevan una X.
- Banda a todo ancho con esquina izquierda redondeada (18 px): nombre en Bricolage 800 (24 px; 18 px en secciones compactas), cantidad y unidad debajo, y a la derecha el texto relativo en mayúsculas con ícono.

## Pantallas

- **Despensa:** cabecera (título 44 px, resumen en una sola línea "N por vencer · N vencidos" en fichas que no se parten a 360 px, botón "+ Agregar" de tinta de 48 px). Tres secciones: **Usar primero** (0 a 3 días), **Con tiempo** y **Ya vencieron · no entran en recetas**. Encabezados de sección fijos (sticky).
- **Recetas:** bloque a todo ancho por receta. Cocinable = lima. "No alcanza" = gris rayado con los faltantes y su motivo. "Aprovecha lo que vence" con la línea de tiempo en pequeño. La preparación queda plegada tras "Ver ingredientes y preparación".
- **Navegación:** barra inferior flotante tipo píldora, fondo tinta, dos segmentos con ícono y texto (el activo en crema).
- **Hoja inferior** para agregar, editar, "usé" y borrar: sube desde abajo, foco atrapado, Escape la cierra y el foco vuelve a la banda/botón que la abrió. Errores bajo cada campo. Confirmación de borrado dentro de la hoja. Sin `alert` ni `confirm`.
- **Estados vacíos:** explican qué hacer y ofrecen "Cargar datos de ejemplo".

Prohibido: degradados morados o azules, glassmorphism, emojis, tarjetas idénticas con sombra, tarjetas con borde de color a un lado, modo oscuro, texto gris sobre color.

## Movimiento

- Easing único `cubic-bezier(.22,1,.36,1)`, sin rebote. Solo `transform` y `opacity`.
- Bandas: entran desde la izquierda 28 px, 520 ms, escalonadas cada 60 ms (máximo 8). Tramos de la línea se dibujan con `scaleY`; nodos de escala 0.3 a 1.
- Scroll: las bandas se revelan al entrar a pantalla (IntersectionObserver, una sola vez); encabezados sticky.
- Pulsar: la banda se comprime `scaleY(.96)` en 100 ms.
- Hoja: sube en 320 ms; al cerrar, 200 ms.
- Aviso de éxito: aparece desde abajo, se retira solo a los 4 s, `aria-live="polite"`, sin robar el foco.
- `prefers-reduced-motion`: sin desplazamientos, solo fundidos cortos; el pulso del nodo "Hoy" se apaga.

## Accesibilidad

- Contraste mínimo 4,5:1 en texto. Objetivos táctiles ≥ 44 px. Foco visible en todo elemento interactivo.
- Etiquetas visibles en cada campo, `aria-label` en botones solo de ícono, íconos decorativos con `aria-hidden`.
- Textos 100 % en español; nombres mostrados con `capitalizarNombre` (solo al mostrar, sin alterar lo guardado).

## Contraste verificado (cálculo WCAG, no a ojo)

| Par | Razón | Mínimo | Resultado |
|---|---|---|---|
| tinta sobre crema | 16,51 | 4,5 | cumple |
| tinta-suave sobre crema | 6,01 | 4,5 | cumple |
| tinta sobre coral / coral claro | 6,44 / 8,14 | 4,5 | cumple |
| tinta sobre mango / mango claro | 11,50 / 13,36 | 4,5 | cumple |
| tinta sobre lima / lima claro | 11,71 / 13,04 | 4,5 | cumple |
| tinta sobre gris rayado A / B | 11,06 / 9,35 | 4,5 | cumple |
| aviso sobre gris A / B | 5,44 / **4,60** | 4,5 | cumple (B es el más justo: no bajar el tono) |
| aviso sobre crema / blanco (campos) | 8,11 / 8,92 | 4,5 | cumple |
| crema sobre tinta (barra inferior) | 16,51 | 4,5 | cumple |
| tinta-suave sobre coral / lima / gris A / gris B | 2,34 / 4,26 / 4,02 / 3,40 | 4,5 | **falla — TEXTO (combinación prohibida)** |
| coral / lima (línea y nodo) sobre crema | 2,56 / 1,41 | 3 (gráfico) | **falla — DECORATIVO (no es texto)** |

Qué es texto y qué es decorativo:
- **Texto, corregido por regla:** el par `tinta-suave` sobre bandas de color falla, por eso está **prohibido**. Auditoría del código: los 15 usos de `text-tinta-suave` en `src/` van sobre el fondo crema (página, encabezados fijos `.encabezado-seccion` y hoja inferior `.hoja`, ambos crema), donde la razón es 6,01:1. Ninguno cae sobre una banda de color. Todo texto dentro de una banda es `tinta` (6,44 a 13,36).
- **Decorativo, sin requisito de texto:** la línea de tiempo (tramos) y el relleno de los nodos en coral/lima sobre crema. Aplica el criterio de 3:1 para gráficos solo a lo que transmite información, y aquí no la transmite sola (el estado va en ícono y texto). El nodo además lleva aro de tinta de 2 px (16,5:1), que es lo que asegura su visibilidad.

Decisiones por los fallos:
1. **Sobre una banda de color solo va tinta**; `tinta-suave` se usa únicamente sobre el fondo crema.
2. Los nodos llevan un **aro de tinta de 2 px** (16,5:1 sobre crema), y la información del estado nunca depende de la línea: va también en ícono y texto.
