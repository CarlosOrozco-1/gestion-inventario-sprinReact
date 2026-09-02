---
name: mejora-ux
description: Usar siempre que se modifique la interfaz del frontend (pantallas, modales, tablas, botones, menús, escáner QR) para garantizar que selle las convenciones de UI/UX del proyecto. Complementa a AGENTS.md sección 5.
---

# Convenciones de UI/UX (SIGES)

Aplica estas reglas en **todo** cambio de interfaz del frontend.

## 1. Texto informativo en tooltips, no en modales/módulos
- Los modales y módulos deben verse **limpios**: sin párrafos ni frases largas.
- La explicación va en un **tooltip** (`title`, `data-tip` o tooltip custom).
- **Excepción:** si el texto es técnico / solo útil para el desarrollador
  (fórmulas, cálculos, criterios internos) NO va en la UI ni en tooltip: va como
  **comentario en el código** junto a la lógica que lo explica.

## 2. Textos breves en campos, títulos y secciones
- Etiquetas y encabezados cortos (una o pocas palabras).
- Si un concepto necesita explicación → tooltip.

## 3. Botones/enlaces de solo icono llevan tooltip
- En el menú colapsado (y cualquier icono suelto) siempre `title` con el nombre.

## 4. Feedback del escáner QR
- Escaneo exitoso → **sonido** de confirmación (`src/utils/sound.ts`) +
  **breve transición de carga** (overlay "Escaneo exitoso / Cargando datos...").
- Reutilizar `QrScanner.tsx`; no duplicar lógica de cámara.

## 5. Diseño de botones de acción principal
- Acción principal = fondo `brand-600`, texto blanco, `px-5 py-2.5 rounded-lg`.
- Acciones secundarias = fondo blanco/borde (ojo: "Escanear QR" es brand).
- Botones equivalentes entre módulos deben ser **visualmente idénticos**.

## 6. Responsive / espacio
- Contenedor de páginas: clase `page-container` (NO `max-w-7xl mx-auto`).
- Al colapsar el menú, el contenido debe expandirse (`main.side-collapsed`).
- Tablas con `overflow-x-auto` (scroll horizontal en pantallas angostas).

## Verificación al terminar
1. `npm run build` en `frontend/` sin errores.
2. Revisar con Chromium headless que la app monta (ver `deploy-docker`).