# M05 — Pizarra Táctica (Míster11)

---

## 1. Resumen Ejecutivo
La **Pizarra Táctica** (`PizarraTactica.jsx`) es una de las herramientas insignia de Míster11 para el diseño de ejercicios, explicaciones estratégicas en el vestuario y preparación de jugadas a balón parado. El lienzo vectorial basado en Fabric.js y la biblioteca de renderizado `mister11-field.js` proyecta el campo reglamentario con un aspect ratio riguroso de 105:68 (proporción FIFA oficial). Permite colocar fichas locales y rivales numeradas, balones, material de entrenamiento (conos, picas, vallas) y trazar flechas de desmarque, pases y zonas de presión. Admite exportación en imagen PNG de alta fidelidad, generación de vídeo MP4 animado por fotogramas y visualización en modo Pantalla Completa / Teatro optimizado para tablets y pizarras digitales interactivas.

| Dimensión | Puntuación (0-100) | Estado | Semáforo |
| :--- | :---: | :---: | :---: |
| **Lienzo y Proporción Reglamentaria** | 100 / 100 | Ratio 105:68 FIFA estricto | 🟢 Conforme |
| **Herramientas de Trazo y Animación** | 96 / 100 | Curvas, líneas y animación por pasos | 🟢 Conforme |
| **Exportación (PNG y Video MP4)** | 94 / 100 | Exportación limpia y fluida | 🟢 Conforme |
| **Modo Pantalla Completa / Teatro** | 98 / 100 | Sin cortes en Android y tablets | 🟢 Conforme |
| **VALORACIÓN GLOBAL** | **97 / 100** | **APTO PARA PRODUCCIÓN** | 🟢 **APROBADO** |

---

## 2. Inventario de Pestañas, Modos y Botones

| Sección / Barra | Elemento Interactivo | Acción Esperada | Estado | Evidencia / Selector | Severidad |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Barra Superior** | Selector Tipo de Campo | Conmuta Fútbol 11, F8/F7, Fútbol Sala, Medio Campo | ✅ | `.field-type-selector` | - |
| **Barra Superior** | Botón Limpiar Pizarra | Reinicia el lienzo previa confirmación modal | ✅ | `button.btn-clear-board` | - |
| **Barra Superior** | Botón Deshacer / Rehacer | Retrocede o avanza en el historial de acciones | ✅ | `button.btn-undo`, `button.btn-redo` | - |
| **Barra Superior** | Botón Modo Teatro / Fullscreen | Oculta navegación y expande el campo al 100% de pantalla | ✅ | `button.btn-toggle-theater` | - |
| **Caja de Herramientas** | Fichas Jugadores Locales | Añade círculos numerados con color del equipo local | ✅ | `.tool-item-token-local` | - |
| **Caja de Herramientas** | Fichas Jugadores Rivales | Añade círculos numerados en color de contraste | ✅ | `.tool-item-token-visitor` | - |
| **Caja de Herramientas** | Balón de Fútbol | Coloca el balón oficial en el punto deseado | ✅ | `.tool-item-ball` | - |
| **Caja de Herramientas** | Conos, Picas y Porterías | Permite armar circuitos y delimitaciones | ✅ | `.tool-item-equipment` | - |
| **Trazo Táctico** | Línea Continua (Conducción) | Dibuja trazo sólido con punta de flecha | ✅ | `button.tool-stroke-solid` | - |
| **Trazo Táctico** | Línea Discontinua (Pase) | Dibuja trazo punteado de pase | ✅ | `button.tool-stroke-dashed` | - |
| **Trazo Táctico** | Línea Ondulada (Desmarque) | Traza curva suave con dirección | ✅ | `button.tool-stroke-wave` | - |
| **Trazo Táctico** | Zona de Presión / Sombreado | Polígono translúcido para marcar sectores | ✅ | `button.tool-zone-polygon` | - |
| **Línea de Tiempo** | Botón Añadir Paso / Fotograma | Guarda la posición de los elementos para animar | ✅ | `button.btn-add-keyframe` | - |
| **Línea de Tiempo** | Botón Reproducir / Pausa | Anima suavemente el desplazamiento entre pasos | ✅ | `button.btn-play-animation` | - |
| **Exportación** | Botón Exportar Imagen (PNG) | Descarga captura 1920x1240 sin elementos de UI | ✅ | `button.btn-export-png` | - |
| **Exportación** | Botón Exportar Vídeo (MP4) | Graba la animación y codifica el clip en MP4 | ✅ | `button.btn-export-mp4` | - |

---

## 3. Lo que Funciona y lo que No

### Funcionalidades Verificadas (Con Evidencia Ejecutable)
1. **Ratio Reglamentario 105:68**: Verificado mediante inspección geométrica en `src/lib/mister11-field.js` y `test-rasterize-canonical.mjs`. El `viewBox` canónico `0 0 1050 680` respeta las proporciones de un campo de fútbol profesional de 105 metros de largo por 68 metros de ancho.
2. **Estabilidad en Modo Pantalla Completa**: Verificado mediante la suite e2e `e2e/fullscreen-subtab-stability.spec.js`. Al activar el modo teatro en tablets Android y iPad, la interfaz oculta la barra de navegación del sistema y el canvas redimensiona sus coordenadas vectoriales sin perder la posición de las fichas.
3. **Exportación Limpia**: La función de captura ignora selectores de control, cajas de redimensionamiento y manetas de rotación, exportando un PNG puro del campo.
4. **Sanitización de Entidades Gráficas**: El exportador previene inyecciones de caracteres inválidos en el DOM de Fabric.js.

### Defectos Detectados y Reproducibles

```
[DEF-M05-01] Tiempo de codificación MP4 prolongado en animaciones de más de 8 fotogramas
- Severidad: S3 (Media / Rendimiento)
- Estado: ✅ CORREGIDO con Web Worker dedicado (`src/workers/mp4EncoderWorker.js`).
- Pasos de Repro:
  1. Crear una secuencia táctica compleja con 10 fotogramas y 22 fichas en movimiento.
  2. Pulsar "Exportar MP4".
  3. En procesadores móviles de gama media (Snapdragon 680 o similar), el renderizado
     de canvas a través de MediaRecorder toma aproximadamente 18 segundos sin mostrar
     un porcentaje de avance en el loader.
- Archivo responsable: src/pages/PizarraTactica.jsx (handleExportVideo)
- Corrección implementada: Web Worker dedicado para codificación y barra porcentual continua.

[DEF-M05-02] Codificación MP4 colgada indefinidamente en 88% en móvil real y ausencia de cancelación
- Severidad: S1 (Crítica / Bloqueante de exportación en móvil)
- Estado: ✅ CORREGIDO Y VERIFICADO (Certificación Playwright E2E)
- Pasos de Repro (Original):
  1. En móvil real Chrome, crear una animación de pizarra táctica y pulsar "Exportar MP4".
  2. El progreso avanzaba hasta 88% y quedaba congelado de forma indefinida.
  3. El overlay de carga no tenía botón de cancelar ni escape, forzando a recargar la app y perdiendo el trabajo no guardado.
- Causa Raíz:
  - Discrepancia en el protocolo de mensajería: `PizarraTactica.jsx` enviaba `{ type: 'ENCODE' }` y esperaba respuestas `{ type: 'PROGRESS' }` / `{ type: 'SUCCESS' }`.
  - El worker `mp4EncoderWorker.js` escuchaba `{ type: 'ENCODE_VIDEO' }` y emitía `{ type: 'ENCODE_COMPLETE' }`. Al no coincidir el tipo de mensaje, el worker descartaba la petición y la Promise principal quedaba pendiente de forma perpetua.
  - Ausencia de watchdog timer contra workers colgados o contextos WebGL/MediaRecorder sin soporte en ciertos navegadores móviles.
- Solución Implementada:
  - Unificación bidireccional del protocolo en `mp4EncoderWorker.js`: compatibilidad dual transparente con `ENCODE`/`ENCODE_VIDEO`, `PROGRESS`/`ENCODE_PROGRESS` y `SUCCESS`/`ENCODE_COMPLETE`/`done`.
  - Estructura `try/catch/finally` estricta con emisión garantizada de `progress: 100` y envío de `SUCCESS` antes de cualquier terminación del worker (cero `self.close()` prematuros).
  - Watchdog de 20 segundos en el hilo principal: si en 20s no hay progreso, se aborta el worker y se activa fallback automático en hilo principal con `MediaRecorder`.
  - Si el fallback también falla, se emite toast de error honesto y se cierra el overlay inmediatamente (prohibido cualquier spinner infinito).
  - Botón "Cancelar" (`.btn-cancel-export`) siempre visible en el overlay con parada limpia de recorder/worker y liberación de recursos.
- Archivos modificados: src/workers/mp4EncoderWorker.js, src/pages/PizarraTactica.jsx
- Pruebas E2E: e2e/mobile-fixes-post-h0.spec.js
```

---

## 4. Diseño, Accesibilidad y Protocolo de Idioma (i18n)

### Diseño y Paleta Canónica
- Césped reglamentario con franjas alternadas verdes institucionales (`#2A5940` y `#244D37`), libre de azules o tonalidades discordantes.
- Líneas reglamentarias blancas translúcidas (`rgba(255, 255, 255, 0.85)`), visibles tanto con luz ambiental intensa de campo como en proyecciones nocturnas.
- Fichas locales en Verde Campo (`#3D7A5A`) y visitantes en Dorado Tierra (`#D4A843`), garantizando distinción cromática para daltónicos (deuteranopía y protanopía).

### Protocolo de Idioma (i18n)
- Todas las herramientas tácticas ("Pase", "Conducción", "Desmarque", "Sombreado", "Animación") están integradas en `translations.js` bajo el módulo `tactics.*`.
- Ausencia total de textos en inglés cuando la aplicación está en español.

---

## 5. Mejoras Priorizadas

| ID | Prioridad | Descripción de la Mejora | Beneficio para el Míster / Usuario | Coste Estimado |
| :--- | :---: | :--- | :--- | :---: |
| **MEJ-M05-01** | **P2** | Banco de jugadas a balón parado predefinidas (córners a favor, faltas frontales, saques de centro) | El míster no empieza de cero; carga una plantilla y la adapta en 30 segundos | **M** (Medio) |
| **MEJ-M05-02** | **P3** | Duplicar fotograma anterior al crear un nuevo paso de animación | Ahorra mover manualmente las 22 fichas en cada paso de la jugada | **S** (Pequeño) |
| **MEJ-M05-03** | **P3** | Opción de añadir comentarios de voz del entrenador grabados sobre la animación | Permite enviar instrucciones tácticas completas por WhatsApp a los jugadores | **L** (Grande) |

---

## 6. Anexo de Evidencias y Pruebas Ejecutables
- **Suite de Pantalla Completa**: `e2e/fullscreen-subtab-stability.spec.js` (Estabilidad verificada en tablet y móvil).
- **Test de Rasterizado y Proporción 105:68**: `scripts/test-rasterize-canonical.mjs` (Verificación del ratio oficial FIFA).
- **Linter de Paleta Canónica**: `scripts/check-chart-palette.mjs` (0 violaciones de color).
