# MÍSTER 11 — ESTÁNDAR OFICIAL DE MEDIOS HÍBRIDOS RAYOS-X 3D + MICRO-LOOP WEBP (OLEADA 10)

- **Estado**: Aprobado por el DUEÑO sobre `PROTOTIPO_HIBRIDO_XRAY_MICROLOOP_MISTER11.md`
- **Build**: `95` (Closed Testing)
- **Ubicación del prototipo y activos base**: `docs/svg-drafts/hybrid-prototype/`
- **Script de conversión automática**: `scripts/optimize-exercise-media.mjs`
- **Validador de integridad**: `scripts/test-hybrid-media-integrity.mjs`

---

## 1. Arquitectura Híbrida de 2 Capas + Micro-Loop WebP

Para conservar el **100% de la estética 3D volumétrica Rayos-X** de las referencias del DUEÑO (fondo de laboratorio verde oscuro con retícula en perspectiva, membrana corporal de cristal esmeralda translúcido, esqueleto óseo marfil interno, fibras musculares bioluminiscentes y anillos/vectores dorados `#D4A843`) manteniendo un peso ultraligero para Android y Web:

1. **Capa Base 3D (`<id>-card.webp` y `<id>-full.webp`)**:
   - Resolución de tarjeta `4:3` / `16:10`: `640×516 px` a `640×673 px` (`quality: 78`).
   - Peso real medido: **`12.1 KB – 23.0 KB`** por ejercicio (promedio `16.9 KB`).
   - Proyección para los 118 ejercicios del catálogo: **`~2.0 MB` en total**.
2. **Capa Vectorial Superior (`<id>-overlay.svg`)**:
   - Peso real medido: **`~1.8 KB`** por ejercicio.
   - Contiene los anillos dorados animados (`.m11-ring-dash`), el pulso bioluminiscente sobre las `canonicalTargetZones` exactas de `CANONICAL_EXERCISE_SAFETY_MAP`, y las etiquetas traducibles en tiempo real (`ES / EN / PT / FR / ID`), con soporte `@media (prefers-reduced-motion: reduce)`.
3. **Micro-Loop Animado Autónomo (`<id>-microloop.webp`)**:
   - WebP animado nativo (`loop: 0`, 4 fases) de **`69.9 KB – 94.6 KB`** que funciona directamente dentro de cualquier etiqueta `<img>` sin reproductor de video.

---

## 2. Inventario del Primer Lote Convertido (5 Ejercicios)

| ID Ejercicio | Nombre | `*-card.webp` | `*-full.webp` | `*-overlay.svg` | `*-microloop.webp` | `canonicalTargetZones` |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`sys-1`** | Plancha Frontal | `12.1 KB` | `12.7 KB` | `2.07 KB` | `72.9 KB` | `["core"]` |
| **`sys-2`** | Puente de Glúteo Bilateral | `17.1 KB` | `20.0 KB` | `2.32 KB` | `83.7 KB` | `["gluteo_mayor", "isquiosurales", "core"]` |
| **`sys-9`** | Plancha Lateral | `17.9 KB` | `19.5 KB` | `2.18 KB` | `81.8 KB` | `["core", "oblicuos"]` |
| **`hex-015`** | Estiramiento Isquiosurales con Banda (90°) | `14.8 KB` | `16.7 KB` | `2.25 KB` | `69.9 KB` | `["isquiosurales", "gemelos"]` |
| **`hex-008`** | Movilidad de Cadera en Cuadrupedia (45°) | `23.0 KB` | `21.9 KB` | `2.23 KB` | `94.6 KB` | `["gluteo_medio", "cadera"]` |

---

## 3. Flujo para Subir Nuevas Imágenes o Micro-Loops

1. Depositar las imágenes `.jpg` / `.png` (o pares `<id>-a.jpg` y `<id>-b.jpg`) en `docs/svg-drafts/raw-inputs/` con el ID del ejercicio (ej. `sys-3.jpg`, `sys-8.jpg`, `hex-007.jpg`).
2. Ejecutar:
   ```bash
   node scripts/optimize-exercise-media.mjs
   node scripts/test-hybrid-media-integrity.mjs
   ```
3. Revisar en `docs/svg-drafts/hybrid-prototype/mister11-hybrid-xray-showcase.html` antes de promover al catálogo de producción.
