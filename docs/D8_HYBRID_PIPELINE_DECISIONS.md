# D8 — Decisiones del Dueño sobre Pipeline Híbrido Rayos-X 3D (P12-C)

> [!IMPORTANT]
> **Estado**: **FIRMADA POR EL DUEÑO** (`2026-11-23`)
> **Alcance**: Read-Only sobre producto (`src/**`, catálogo, `exerciseSafetyMap.js` e i18n permanecen intactos). Este documento rige únicamente `docs/` y `scripts/` del pipeline híbrido.

---

## 1. Firma de Decisión D8 y sus 7 Condiciones

El **DUEÑO** aprueba y firma el estándar híbrido (**Capa 1 Base 3D WebP + Capa 2A Máscara Glow Píxel-Exacta + Capa 2B HUD Vectorial SVG + Micro-Loop WebP**) sujeto a las **7 condiciones vinculantes** siguientes:

| # | Condición Vinculante | Regla Operativa y Validación |
| :---: | :--- | :--- |
| **1** | **Presupuesto estricto de peso móvil (Android First)** | Cada ejercicio híbrido debe cumplir: `card.webp <= 40 KB`, `full.webp <= 40 KB`, `glow.webp <= 15 KB`, `overlay.svg <= 10 KB`, `microloop.webp <= 150 KB`. |
| **2** | **Alineación píxel-exacta (0.0 px) y 0 círculos falsos** | La máscara `<id>-glow.webp` se extrae píxel a píxel del render 3D real. Prohibido dibujar anillos o puntos vectoriales flotantes en `<id>-overlay.svg` que se desfasen de la anatomía. |
| **3** | **Paleta Tierra y Campo con Enmienda "Excepción Clinical Glow"** *(Enmendada por el DUEÑO)* | **Excepción `clinical glow`**: el verde neón tipo `#3CFF8F` se permite **SOLO dentro de capas raster** (`WebP` base y máscara `glow`) como iluminación muscular bioluminiscente. **Todo elemento vectorial** (HUD, anillos, flechas, `✕`, barras, textos) debe usar exclusivamente la paleta canónica **Tierra y Campo**: `#1B3A2D`, `#4CAF7D`, `#2E7D52`, `#D4A843`, `#C85A32`, `#9C6A3B`, `#F7F5F0`. Validado automáticamente por Check `[10]` en `scripts/test-hybrid-media-integrity.mjs`. |
| **4** | **Multilingüe 100% vectorizado (sin texto en raster)** | Las imágenes rasterizadas 3D no deben contener texto incrustado; las etiquetas de fase, zonas canónicas y advertencias viven en el HUD vectorial y/o llaves i18n (`ES / EN / PT / FR / ID`). |
| **5** | **Accesibilidad y respeto a `prefers-reduced-motion`** | Todo `<id>-overlay.svg` y SVG híbrido animado debe incluir `@media (prefers-reduced-motion: reduce)` deteniendo pulsos CSS. |
| **6** | **4 Banderas Rojas Automáticas obligatorias** | Ningún activo híbrido pasa el gate si dispara alguna de las 4 banderas rojas en `test-hybrid-media-integrity.mjs`: (1) glow con `0` píxeles verdes, (2) silueta cortada en borde, (3) glow fuera del cuerpo, (4) aspect ratio inconsistente entre capas. |
| **7** | **Trazabilidad (`provenance`), clasificación por Nivel (A/B/C) y gobernanza clínica** | Todo activo híbrido debe incluir un `<id>-manifest.json` que declare explícitamente `provenance: "ai_generated"` (o `provenance.source: "ai_generated"`) y su `reviewTier` (`A`, `B` o `C` según `docs/REVIEW_TIERS_OLEADA10.md`). Validado automáticamente por Check `[11]`. Ningún script puede auto-firmar `reviewed_by_human` ni `rigVerifiedBy` ni desbloquear ejercicios en `src/`. |

---

## 2. Decisión 1A — Mapeo Anatómico del Puente Unilateral (`hex-021` vs `sys-2` vs `hex-075`)

Durante la auditoría anatómica del lote híbrido, el DUEÑO resolvió explícitamente la correspondencia de la ilustración de **puente unilateral con pierna libre flexionada**:

| ID | Nombre en Catálogo | Estado de Asset (Pipeline Híbrido) | Nivel de Revisión | Resolución del DUEÑO (Decisión 1A) |
| :--- | :--- | :--- | :---: | :--- |
| **`hex-021`** | **Activación de Glúteo en Puente Unipodal Dinámico** | `pending_owner_review` | **Nivel B** | **ASIGNADO AQUÍ**: la imagen híbrida de puente unilateral (pierna libre flexionada) se mapea exclusivamente a `hex-021`. |
| **`sys-2`** | **Puente de Glúteos** *(bilateral)* | `pending_regeneration_bilateral` | **Nivel B** | **NO asignar imagen unilateral**: `sys-2` es bilateral (ambos pies apoyados) y requiere regeneración específica bilateral. |
| **`hex-075`** | **Puente de Glúteo Unipodal con Pierna Extendida** | `pending_asset_pierna_extendida` | **Nivel B** | **NO asignar imagen con pierna flexionada**: `hex-075` exige pierna libre completamente extendida. |

> [!NOTE]
> Esta decisión queda registrada en `docs/` y reflejada en los metadatos de los manifiestos del prototipo sin alterar `src/data/systemCoreExercises.js`, `src/data/homeExercisesCatalog.js` ni `src/data/exerciseSafetyMap.js`.

---

## 3. Verificación Automatizada de Cumplimiento (Checks `[10]` y `[11]`)

`scripts/test-hybrid-media-integrity.mjs` incorpora dos nuevos checks bloqueantes alineados con D8:

- **Check `[10]` — Paleta Vectorial Canónica vs Excepción Clinical Glow en Raster**:
  - Extrae todos los tokens hex (`#RGB` / `#RRGGBB`) de cada `<id>-overlay.svg` **excluyendo** cualquier payload `data:image/...;base64,...`.
  - Exige que el 100% de los hex vectoriales pertenezcan a la allowlist **Tierra y Campo**:
    `#1B3A2D`, `#4CAF7D`, `#2E7D52`, `#D4A843`, `#C85A32`, `#9C6A3B`, `#F7F5F0`.
  - Rechaza cualquier neón (como `#3CFF8F` o `#74F2A7`) en elementos vectoriales; el brillo neón solo se tolera dentro de las capas raster (`-card.webp` y `-glow.webp`).
- **Check `[11]` — Integridad de Manifest (`provenance` y `reviewTier`)**:
  - Verifica que exista `<id>-manifest.json` para cada activo híbrido.
  - Valida que declare `provenance === "ai_generated"` (o `provenance.source === "ai_generated"`) y `reviewTier` válido (`"A"`, `"B"` o `"C"`) coherente con `scripts/classify-exercise-review-tier.mjs`.
