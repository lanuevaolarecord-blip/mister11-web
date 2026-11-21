# MÍSTER11 — P12-B: DOCUMENTO DE REVISIÓN PARA EL DUEÑO — CANDIDATO SVG `sys-9` (PLANCHA LATERAL)

- **Build:** `95` (Closed Testing)
- **Rama:** `main`
- **HEAD base:** `c61902b`
- **Estado del candidato:** `DRAFT DOCUMENTAL EN REVISIÓN` (`reviewed_by_human: false`, `status: rejected_by_owner` en producto; **NO** es activo oficial ni desbloquea prescripción).

> **Advertencia obligatoria:**
> Guía visual orientativa en rediseño. No validada clínicamente. No sustituye supervisión ni valoración profesional.

---

## 1. Ficha Literal de `sys-9` desde Fuente de Verdad (Paso 1)

Fuentes verificadas en modo `READ-ONLY`:
- `src/data/systemCoreExercises.js` (líneas 511–574)
- `src/data/exerciseSafetyMap.js` (`CANONICAL_EXERCISE_SAFETY_MAP['sys-9']`)
- `src/data/targetZoneCanonicalMap.js`
- `src/utils/exerciseSafety.js`
- `docs/EXERCISE_INVENTORY_OLEADA10.md`
- `docs/EXERCISE_INVENTORY_OLEADA10_POST_P12A.json` (líneas 536–587)

| Campo | Valor |
|---|---|
| `id` | `sys-9` |
| `nombre ES` | `Plancha Lateral` |
| `nombre EN` | `Side Plank` |
| `categoría` | `fortalecimiento` |
| `tier_riesgo` | `bajo` |
| `edadMin` | `10` |
| `supervision` | `false` (`supervision_catalog: false`, `supervision_effective: false`) |
| `canonicalTargetZones` | `["core", "oblicuos"]` |
| `illustration.type` | `vector_svg` |
| `illustration.status` | `rejected_by_owner` |
| `reviewed_by_human` | `false` |
| `rigVerifiedBy` | `[CAMPO_NO_DECLARADO_EN_FUENTE]` (`null`) |
| `prescribable_hoy` | `false` |
| `reason actual si bloqueado` | `illustration_rejected_by_owner` |

> **Nota de trazabilidad sobre `canonicalTargetZones`:**
> - En `src/data/systemCoreExercises.js`, `CANONICAL_EXERCISE_SAFETY_MAP['sys-9'].canonicalTargetZones` y `docs/EXERCISE_INVENTORY_OLEADA10_POST_P12A.json`, las zonas canónicas declaradas para `sys-9` son exactamente `["core", "oblicuos"]` (ampliadas en P12-A desde `["core"]` en el baseline P11).
> - En `src/data/targetZoneCanonicalMap.js`, la constante auxiliar `REDESIGN_SVG_CANONICAL_ZONES['sys-9']` incluía además `'estabilizadores_lumbopelvicos'` como nota de brief, pero la fuente de verdad del ejercicio (`systemCoreExercises.js` y `CANONICAL_EXERCISE_SAFETY_MAP['sys-9'].canonicalTargetZones`) declara `["core", "oblicuos"]`. Siguiendo la regla estricta del Paso 1 (*"Usa solo lo que diga la fuente"*), la capa `#muscle-zones` del SVG candidato utiliza única y exclusivamente `data-canonical-zones="core,oblicuos"` (`#zone-core` y `#zone-oblicuos`), sin inventar ni añadir un tercer músculo.

---

## 2. Especificación Biomecánica Orientativa (Paso 2)

- **Silueta corporal visible (`#body-silhouette`):** Cuerpo completo de perfil/oblicuo técnico con volumen anatómico diferenciado (cabeza, cuello, tórax, pelvis, ambos muslos, ambas piernas, pies apoyados por el borde lateral, brazo/antebrazo de soporte y brazo libre sobre el flanco superior).
- **Puntos de apoyo (`#support-points`):**
  1. Borde externo del pie inferior sobre la esterilla (`cx=132, cy=286`).
  2. Antebrazo apoyado en el suelo (`cx=484, cy=286`) con marcador de ángulo recto (`90°`) del codo directamente bajo el hombro (`x=462`).
- **Alineación axial (`#axis-line`):** Línea punteada en Oro (`#D4A843`) desde pies hasta cabeza (`118,272 -> 532,106`) pasando por tobillo, rodilla, cadera elevada y hombro.
- **Zonas musculares orientativas (`#muscle-zones`):**
  - `core` (`#zone-core`, `#4CAF7D`)
  - `oblicuos` (`#zone-oblicuos`, `#2E7D52`)
- **Error común y marcador `X` (`#error-marker`):**
  - Trayectoria punteada en Terracota (`#C85A32`) representando la caída de la cadera/pelvis hacia el suelo.
  - Marcador primario en forma de **`X`** dentro de disco de alto contraste (`#F7F5F0` / `#C85A32`) situado en la coordenada de la cadera caída (`324, 252`), legible en impresión blanco y negro por su forma geométrica primaria.
- **Variantes informativas opcionales (`#regression-layer` y `#progression-layer`):**
  - Regresión opcional: apoyo de rodilla inferior en el suelo (`236, 284`).
  - Progresión informativa: pierna superior elevada (solo referencia visual, no prescripción automática).

---

## 3. Rutas de los Archivos Generados (Paso 3)

- **Ruta del SVG draft:** `docs/svg-drafts/sys-9/sys-9-guide-draft.svg`
- **Ruta del HTML preview documental:** `docs/svg-drafts/sys-9/sys-9-guide-draft.html`
- **Ruta de la especificación de diseño:** `docs/svg-drafts/sys-9/sys-9-design-spec.md`
- **Ruta del reporte de validación:** `docs/svg-drafts/sys-9/sys-9-validation-report.md`
- **Ruta del script de validación:** `scripts/test-svg-draft-integrity.mjs`

*(Ningún archivo fue creado ni modificado en `src/assets/` ni importado en componentes de producto).*

---

## 4. Tamaño en Bytes y KB (Paso 6)

| Archivo | Bytes | KB | Estado |
|---|---:|---:|---|
| `sys-9-guide-draft.svg` | `11079` | `10.82 KB` | `< 30 KB` ideal y `< 50 KB` máximo (`PASS`) |

Comando de verificación ejecutado:
```text
$ node scripts/test-svg-draft-integrity.mjs
✅ [2/14] Peso del SVG = 11079 bytes (10.82 KB) < 50 KB (cumple ideal < 30 KB: true)
```

---

## 5. Paleta Tierra y Campo Utilizada (Paso 5)

| Elemento | Color Hex | Rol en paleta Tierra y Campo |
|---|---|---|
| Silueta corporal principal | `#1B3A2D` | Verde Selva institucional |
| Segmento corporal lejano (volumen 2.5D) | `#2E4A3E` | Derivado oscuro accesible de `#1B3A2D` |
| Músculo activo `core` y nodos articulares | `#4CAF7D` | Verde Campo institucional |
| Músculo activo `oblicuos` (flanco inferior) | `#2E7D52` | Verde Fuerte / halo muscular |
| Eje axial y anillos articulares | `#D4A843` | Oro institucional |
| Marcador `X` y curva de error (cadera caída) | `#C85A32` | Terracota institucional |
| Indicador `90°`, regresión y bordes | `#9C6A3B` | Ocre institucional |
| Fondo print-friendly y etiquetas | `#F7F5F0` / `#FAF8F5` | Crema claro apto para impresión |
| Esterilla y retícula técnica | `#E2E8F0` / `#CBD5E1` | Neutros accesibles |

- **Colores prohibidos verificados (`0` apariciones):** `#0D9488`, `#10B981`, `#0A2540`, cian, azul eléctrico, magenta, verde neón, fondos oscuros 3D.

---

## 6. Capas Presentes en el SVG (Paso 4)

1. `id="support-points"` (obligatoria)
2. `id="body-silhouette"` (obligatoria)
3. `id="muscle-zones"` con `data-canonical-zones="core,oblicuos"` (obligatoria)
4. `id="axis-line"` (obligatoria)
5. `id="joints"` (obligatoria)
6. `id="error-marker"` (obligatoria)
7. `id="warning-layer"` (obligatoria)
8. `id="regression-layer"` (opcional incluida)
9. `id="progression-layer"` (opcional incluida)

---

## 7. Resultados de Validación Automática (Paso 7 y Paso 9)

- `node scripts/test-svg-draft-integrity.mjs`: **`14/14 PASS`** (`exit=0`, `console_errors = []`).
- `node scripts/closure-gate.mjs`: **`RESULTADO: PASS-CON-DEUDA ⚠️`** (`5 pending-native-5b`, `0 DEFAULT-unknown`, `Total Fallos Registrados: 0`, `console_errors = []`).
- `npx tsc --noEmit`: **`exit=0`**.
- `npx vitest run`: **`3 passed (47 tests)`**, **`exit=0`**.

---

## 8. Preguntas de Revisión para el DUEÑO (Paso 10)

| Pregunta | Opciones |
|---|---|
| ¿La silueta corporal se entiende? | sí / no / needs adjustment |
| ¿Los músculos resaltados coinciden con `targetZones` (`core`, `oblicuos`)? | sí / no / needs adjustment |
| ¿El error de cadera caída se ve claro? | sí / no / needs adjustment |
| ¿El estilo es Míster11, no render IA oscuro? | sí / no / needs adjustment |
| ¿Apto como draft para siguiente iteración? | sí / no |

---

## 9. Gate Humano y Límites de Gobernanza

- El **DUEÑO** debe responder con su aprobación, rechazo o ajustes solicitados sobre este candidato draft.
- Antigravity **NO** ha seteado `reviewed_by_human: true` (`sys-9` permanece con `reviewed_by_human: false` y `status: "rejected_by_owner"`).
- Antigravity **NO** ha movido el SVG a `src/assets/` oficiales ni ha desbloqueado la prescripción de `sys-9`.
- Si el DUEÑO aprueba este candidato, el siguiente paso será **P12-C**: promoción controlada a activo draft-oficial o iteración al siguiente ejercicio rechazado con diff acotado y tests.
